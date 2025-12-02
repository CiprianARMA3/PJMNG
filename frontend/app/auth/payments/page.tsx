"use client";

import React, { useState } from "react";
import { Check, Building2, Shield, Users } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    price: 0,
    description: "For hobbyists.",
    features: ["1 Seat", "Community Support", "7-day History"],
    current: false,
  },
  {
    name: "Pro",
    price: 49,
    description: "For growing teams.",
    features: ["5 Seats", "Priority Support", "30-day History", "API Analytics"],
    current: true, // Mock current plan
    recommended: true,
  },
  {
    name: "Enterprise",
    price: 199,
    description: "For scaling orgs.",
    features: ["20 Seats", "Dedicated Manager", "Unlimited History", "SSO & Audit Logs"],
    current: false,
  },
];

export default function SubscriptionPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-indigo-500/30 flex justify-center pb-20">
      <div className="w-full max-w-5xl px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER */}
        <div className="mb-12 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-4">Workspace Plan</h1>
            <p className="text-zinc-400 text-sm mb-8">Choose a plan that fits your team size and compliance needs.</p>
            
            {/* TOGGLE */}
            <div className="inline-flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                <button 
                    onClick={() => setBillingCycle("monthly")}
                    className={`px-6 py-1.5 text-xs font-medium rounded-md transition-all ${billingCycle === "monthly" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                    Monthly
                </button>
                <button 
                    onClick={() => setBillingCycle("yearly")}
                    className={`px-6 py-1.5 text-xs font-medium rounded-md transition-all ${billingCycle === "yearly" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                    Yearly <span className="text-emerald-500 ml-1">-20%</span>
                </button>
            </div>
        </div>

        {/* PLANS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANS.map((plan) => {
                const price = billingCycle === "monthly" ? plan.price : (plan.price * 0.8).toFixed(0);
                
                return (
                    <div 
                        key={plan.name} 
                        className={`
                            relative flex flex-col p-6 rounded-2xl border transition-all duration-300
                            ${plan.recommended 
                                ? "bg-[#0C0C0E] border-indigo-500 shadow-2xl shadow-indigo-500/10 scale-105 z-10" 
                                : "bg-[#09090b] border-zinc-800 hover:border-zinc-700"
                            }
                        `}
                    >
                        {plan.recommended && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full border border-indigo-500 shadow-sm">
                                MOST POPULAR
                            </div>
                        )}

                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                            <p className="text-xs text-zinc-400 mt-1">{plan.description}</p>
                        </div>

                        <div className="mb-6 pb-6 border-b border-zinc-800/50">
                            <span className="text-4xl font-bold text-white tracking-tight">${price}</span>
                            <span className="text-zinc-500 text-sm font-medium"> / mo</span>
                        </div>

                        <div className="flex-1 space-y-4 mb-8">
                            {plan.features.map((feat) => (
                                <div key={feat} className="flex items-center gap-3">
                                    <div className={`p-0.5 rounded-full ${plan.recommended ? "bg-indigo-500/20 text-indigo-400" : "bg-zinc-800 text-zinc-500"}`}>
                                        <Check size={10} strokeWidth={3} />
                                    </div>
                                    <span className="text-xs text-zinc-300 font-medium">{feat}</span>
                                </div>
                            ))}
                        </div>

                        <button 
                            disabled={plan.current}
                            className={`
                                w-full py-3 text-sm font-bold rounded-xl transition-all
                                ${plan.current 
                                    ? "bg-zinc-800 text-zinc-500 cursor-default border border-zinc-700" 
                                    : plan.recommended
                                        ? "bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/5"
                                        : "bg-zinc-900 border border-zinc-700 text-white hover:bg-zinc-800"
                                }
                            `}
                        >
                            {plan.current ? "Current Plan" : "Upgrade"}
                        </button>
                    </div>
                );
            })}
        </div>

        {/* ENTERPRISE CONTACT */}
        <div className="mt-16 text-center border-t border-zinc-800 pt-8">
            <h3 className="text-sm font-bold text-white mb-2">Need custom compliance?</h3>
            <p className="text-xs text-zinc-500 mb-4">
                We offer custom MSA, SLA, and On-Premise deployment for large enterprises.
            </p>
            <button className="text-xs font-medium text-zinc-300 border-b border-zinc-600 hover:text-white hover:border-white transition-colors pb-0.5">
                Contact Sales Team
            </button>
        </div>
        
      </div>
    </div>
  );
}