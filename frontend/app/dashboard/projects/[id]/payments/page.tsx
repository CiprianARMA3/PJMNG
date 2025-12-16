"use client";

import React, { useState, useEffect, use } from "react"; // Import 'use'
import {
  Sparkles,
  ArrowRight,
  ShoppingBag,
  Info,
  Check,
  Loader2
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getTokenPacks, createTokenPackCheckout } from "@/app/actions/stripe";

const formatTokens = (num: number) => {
  if (num >= 1000000) return `${num / 1000000}M`;
  return `${num / 1000}k`;
};

const MODELS = [
  { key: "gemini-2.5-flash", name: "Gemini 2.5 Flash", desc: "Fast, high-volume tasks" },
  { key: "gemini-2.5-pro", name: "Gemini 2.5 Pro", desc: "Complex reasoning tasks" },
  { key: "gemini-3-pro-preview", name: "Gemini 3 Pro", desc: "Advanced coding & logic" },
];

// FIX: Update type to Promise
export default function TokenManagementPage({ params }: { params: Promise<{ id: string }> }) {
  // FIX: Unwrap params using React.use()
  const { id: projectId } = use(params);

  const [selectedModel, setSelectedModel] = useState(MODELS[0].key);
  const [isEnterprise, setIsEnterprise] = useState(false);
  const [packs, setPacks] = useState<any[]>([]);
  const [loadingPacks, setLoadingPacks] = useState(false);
  const [selectedPackIndex, setSelectedPackIndex] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);

  // 1. Check Project Tier
  useEffect(() => {
    const checkTier = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('projects')
        .select(`
          created_by,
          users (
            plan_id,
            plans (
              name
            )
          )
        `)
        .eq('id', projectId) // Use unwrapped projectId
        .single();

      if (data?.users) {
        const userObj = Array.isArray(data.users) ? data.users[0] : data.users;
        const planObj = Array.isArray(userObj.plans) ? userObj.plans[0] : userObj.plans;

        if (planObj?.name === 'Enterprise') {
          setIsEnterprise(true);
        }
      }
    };
    if (projectId) checkTier();
  }, [projectId]);

  // 2. Fetch Packs
  useEffect(() => {
    const fetchPacks = async () => {
      setLoadingPacks(true);
      setSelectedPackIndex(null);
      try {
        const fetchedPacks = await getTokenPacks(selectedModel, isEnterprise);
        setPacks(fetchedPacks);
      } catch (error) {
        console.error("Failed to fetch packs", error);
      } finally {
        setLoadingPacks(false);
      }
    };
    fetchPacks();
  }, [selectedModel, isEnterprise]);

  // 3. Purchase Handler
  const handlePurchase = async () => {
    if (selectedPackIndex === null || !packs[selectedPackIndex]) return;
    setProcessing(true);
    try {
      const pack = packs[selectedPackIndex];
      // Use unwrapped projectId
      await createTokenPackCheckout(projectId, { ...pack, modelKey: selectedModel });
    } catch (err) {
      console.error(err);
      alert("Something went wrong initializing the checkout. See console for details.");
      setProcessing(false);
    }
  };

  const currentPack = selectedPackIndex !== null ? packs[selectedPackIndex] : null;
  const taxAmount = currentPack ? (currentPack.unitAmount / 100) * 0.0 : 0;
  const totalDue = currentPack ? (currentPack.unitAmount / 100) + taxAmount : 0;

  return (
    <div className="min-h-screen bg-[#09090b] light:bg-gray-50 text-zinc-100 light:text-black font-sans flex justify-center pb-20">
      <div className="w-full max-w-5xl px-6 py-12">

        {/* HEADER */}
        <div className="mb-10 border-b border-zinc-800 light:border-gray-200 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white light:text-black mb-2">Purchase AI Tokens</h1>
            <p className="text-zinc-400 light:text-gray-500 text-sm">Select a model and a token pack to refill your project.</p>
          </div>
          {isEnterprise && (
            <div className="px-3 py-1 bg-purple-500/10 light:bg-purple-50 border border-purple-500/30 light:border-purple-200 rounded text-purple-400 light:text-purple-700 text-xs font-bold uppercase tracking-wide">
              Enterprise Pricing
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* LEFT: SELECTION */}
          <div className="lg:col-span-8 space-y-8">
            {/* Model Selector */}
            <section>
              <h3 className="text-sm font-bold text-zinc-500 light:text-gray-500 uppercase tracking-wider mb-4">1. Select Model</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {MODELS.map((model) => (
                  <button
                    key={model.key}
                    onClick={() => setSelectedModel(model.key)}
                    className={`p-4 rounded-xl border text-left transition-all ${selectedModel === model.key
                        ? "bg-zinc-800 light:bg-white border-indigo-500 light:border-indigo-500 ring-1 ring-indigo-500 light:ring-indigo-500"
                        : "bg-[#0C0C0E] light:bg-white border-zinc-800 light:border-gray-200 hover:border-zinc-700 light:hover:border-gray-300"
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={16} className={selectedModel === model.key ? "text-indigo-400 light:text-indigo-600" : "text-zinc-600 light:text-gray-400"} />
                      <span className="font-bold text-sm text-white light:text-black">{model.name}</span>
                    </div>
                    <p className="text-xs text-zinc-500 light:text-gray-500">{model.desc}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Pack Selector */}
            <section>
              <h3 className="text-sm font-bold text-zinc-500 light:text-gray-500 uppercase tracking-wider mb-4">2. Choose Amount</h3>

              {loadingPacks ? (
                <div className="h-40 flex items-center justify-center text-zinc-500 light:text-gray-500 gap-2">
                  <Loader2 size={20} className="animate-spin" /> Loading live prices...
                </div>
              ) : packs.length === 0 ? (
                <div className="p-6 bg-red-500/10 light:bg-red-50 border border-red-500/20 light:border-red-200 rounded-xl text-red-400 light:text-red-700 text-sm">
                  No pricing available for this selection.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {packs.map((pack, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPackIndex(idx)}
                      className={`relative p-5 rounded-xl border transition-all group ${selectedPackIndex === idx
                          ? "bg-white light:bg-black text-black light:text-white border-white light:border-black shadow-xl shadow-white/5 light:shadow-black/10"
                          : "bg-[#0C0C0E] light:bg-white border-zinc-800 light:border-gray-200 hover:border-zinc-600 light:hover:border-gray-300"
                        }`}
                    >
                      <div className="text-xs font-medium opacity-60 mb-1 uppercase tracking-wider">
                        Pack {idx + 1}
                      </div>
                      <div className="text-2xl font-bold font-mono mb-2">
                        {formatTokens(pack.amount)}
                      </div>
                      <div className={`text-sm font-medium ${selectedPackIndex === idx ? "text-zinc-600 light:text-gray-300" : "text-zinc-400 light:text-gray-500"}`}>
                        €{pack.displayPrice}
                      </div>
                      {selectedPackIndex === idx && (
                        <div className="absolute top-4 right-4 text-black light:text-white">
                          <Check size={18} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT: SUMMARY */}
          <div className="lg:col-span-4">
            <div className="sticky top-10">
              <div className="bg-[#0C0C0E] light:bg-white border border-zinc-800 light:border-gray-200 rounded-xl p-6 shadow-2xl light:shadow-lg">
                <h3 className="text-white light:text-black font-bold mb-6 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-zinc-400 light:text-gray-400" /> Order Summary
                </h3>

                {currentPack ? (
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center py-3 border-b border-zinc-800 light:border-gray-200">
                      <div>
                        <div className="text-sm text-white light:text-black font-medium">
                          {MODELS.find(m => m.key === selectedModel)?.name}
                        </div>
                        <div className="text-xs text-zinc-500 light:text-gray-500">{formatTokens(currentPack.amount)} Tokens</div>
                      </div>
                      <div className="font-mono text-zinc-200 light:text-black">€{currentPack.displayPrice}</div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-zinc-400 light:text-gray-500">
                        <span>Subtotal</span>
                        <span>€{currentPack.displayPrice}</span>
                      </div>
                      <div className="flex justify-between text-xs text-zinc-400 light:text-gray-500">
                        <span>VAT (22%)</span>
                        <span>€{taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="h-px bg-zinc-800 light:bg-gray-200 my-2"></div>
                      <div className="flex justify-between text-sm font-bold text-white light:text-black">
                        <span>Total Due</span>
                        <span>€{totalDue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-zinc-500 light:text-gray-400 text-sm italic">
                    Select a pack to view summary
                  </div>
                )}

                <button
                  onClick={handlePurchase}
                  disabled={!currentPack || processing}
                  className={`w-full py-3 font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-all
                    ${currentPack && !processing
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                      : "bg-zinc-800 light:bg-gray-200 text-zinc-500 light:text-gray-400 cursor-not-allowed"}
                  `}
                >
                  {processing ? "Processing..." : <>Pay Securely <ArrowRight size={16} /></>}
                </button>

                <div className="flex items-start gap-2 mt-4 text-[10px] text-zinc-500 light:text-gray-500 bg-zinc-900/30 light:bg-gray-100 p-2 rounded border border-zinc-800/50 light:border-gray-200">
                  <Info size={12} className="shrink-0 mt-0.5" />
                  <p>One-time payment. Tokens are added immediately.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}