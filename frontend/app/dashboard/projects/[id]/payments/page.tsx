"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  Calculator, 
  Plus, 
  Trash2, 
  Sparkles, 
  ArrowRight,
  ShoppingBag,
  History,
  Info,
  Lock
} from "lucide-react";

// --- CONFIG ---
const TAX_RATE = 0.22; // 22% Tax Rate

const MODEL_RATES: Record<string, { name: string; price: number; desc: string }> = {
  "gemini-2.5-flash": { 
    name: "Gemini 2.5 Flash", 
    price: 0.02, 
    desc: "Fast, high-volume tasks." 
  },
  "gemini-2.5-pro": { 
    name: "Gemini 2.5 Pro", 
    price: 0.25, 
    desc: "Complex reasoning tasks." 
  },
  "gemini-3-pro-preview": { 
    name: "Gemini 3 Pro", 
    price: 0.60, 
    desc: "Advanced coding & logic." 
  },
};

type UsageRow = {
  id: number;
  modelKey: string;
  tokens: number; // In units of 100k
};

export default function TokenManagementPage() {
  // Calculator State
  const [usageRows, setUsageRows] = useState<UsageRow[]>([
    { id: 1, modelKey: "gemini-2.5-flash", tokens: 10 },
  ]);

  // Purchase State
  const [subtotal, setSubtotal] = useState<number>(0);

  // Actions
  const addRow = () => {
    const newId = Math.max(...usageRows.map(r => r.id), 0) + 1;
    setUsageRows([...usageRows, { id: newId, modelKey: "gemini-2.5-flash", tokens: 1 }]);
  };

  const removeRow = (id: number) => setUsageRows(usageRows.filter(r => r.id !== id));

  const updateRow = (id: number, field: keyof UsageRow, value: any) => {
    setUsageRows(usageRows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  // Calculations
  const calculatedCost = useMemo(() => {
    return usageRows.reduce((acc, row) => {
      const rates = MODEL_RATES[row.modelKey];
      const cost = row.tokens * rates.price;
      return acc + cost;
    }, 0);
  }, [usageRows]);

  // Derived Financials
  const taxAmount = subtotal * TAX_RATE;
  const totalDue = subtotal + taxAmount;

  // Update subtotal automatically based on calculator
  useEffect(() => {
    setSubtotal(parseFloat(calculatedCost.toFixed(2)));
  }, [calculatedCost]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-indigo-500/30 flex justify-center pb-20">
      <div className="w-full max-w-5xl px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER */}
        <div className="mb-10 border-b border-zinc-800 pb-6">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Purchase AI Tokens</h1>
            <p className="text-zinc-400 text-sm">
                Estimate your usage needs below and purchase the required token capacity. 
                <br/>Purchased tokens are added to your project's quota immediately.
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* LEFT: CALCULATOR (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
                <section className="bg-[#0C0C0E] border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><Calculator size={20} /></div>
                            <div>
                                <h2 className="text-base font-bold text-white">Cost Estimator</h2>
                                <p className="text-xs text-zinc-500">Define your expected traffic to calculate the cost.</p>
                            </div>
                        </div>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-zinc-900/50 border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                        <div className="col-span-6">Model</div>
                        <div className="col-span-4 text-right">Tokens (100k Units)</div>
                        <div className="col-span-2"></div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-zinc-800">
                        {usageRows.map((row) => {
                            const rates = MODEL_RATES[row.modelKey];
                            return (
                                <div key={row.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-zinc-900/20 transition-colors">
                                    <div className="col-span-6">
                                        <select 
                                            value={row.modelKey}
                                            onChange={(e) => updateRow(row.id, 'modelKey', e.target.value)}
                                            className="w-full bg-transparent text-sm font-medium text-white outline-none cursor-pointer"
                                        >
                                            {Object.keys(MODEL_RATES).map(k => (
                                                <option key={k} value={k} className="bg-[#0C0C0E]">{MODEL_RATES[k].name}</option>
                                            ))}
                                        </select>
                                        <div className="text-[10px] text-zinc-500 mt-1">{rates.desc}</div>
                                    </div>
                                    
                                    <div className="col-span-4">
                                        <div className="relative">
                                            <input 
                                                type="number" min="0" step="1" value={row.tokens}
                                                onChange={(e) => updateRow(row.id, 'tokens', parseFloat(e.target.value) || 0)}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-right text-sm text-zinc-200 outline-none focus:border-indigo-500 transition-all font-mono"
                                            />
                                            <div className="absolute right-12 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 pointer-events-none pr-1">
                                                x 100k
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-2 text-right">
                                        <button onClick={() => removeRow(row.id)} className="text-zinc-600 hover:text-red-400 transition-colors p-2 rounded hover:bg-zinc-800">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/30 flex justify-between items-center">
                        <button onClick={addRow} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-2 uppercase transition-colors">
                            <Plus size={14} strokeWidth={3} /> Add Scenario
                        </button>
                    </div>
                </section>
                
                {/* RATES INFO */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.values(MODEL_RATES).map((rate) => (
                         <div key={rate.name} className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/20">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles size={14} className="text-indigo-500" />
                                <span className="text-xs font-bold text-white">{rate.name}</span>
                            </div>
                            <div className="text-[11px] text-zinc-400">
                                Cost: <span className="text-zinc-200 font-mono">${rate.price.toFixed(2)}</span> / 100k
                            </div>
                         </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: CHECKOUT (4 cols) */}
            <div className="lg:col-span-4">
                <div className="sticky top-10 space-y-6">
                    <div className="bg-[#0C0C0E] border border-zinc-800 rounded-xl p-6 shadow-2xl">
                        <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                            <ShoppingBag size={18} className="text-zinc-400"/> Checkout
                        </h3>

                        <div className="space-y-6 mb-6">
                             {/* SUBTOTAL (READ ONLY) */}
                             <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase font-bold text-zinc-500 flex items-center justify-between">
                                    Subtotal (Tokens)
                                    <Lock size={10} className="text-zinc-600" />
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-white transition-colors">$</span>
                                    <input 
                                        type="number" 
                                        value={subtotal}
                                        readOnly
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-8 pr-4 py-3 text-zinc-300 font-mono text-lg outline-none cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-[10px] text-zinc-600">
                                    Adjust the scenarios on the left to change this amount.
                                </p>
                             </div>

                             {/* SUMMARY */}
                             <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/50">
                                <div className="flex justify-between items-center text-xs mb-2">
                                    <span className="text-zinc-400">Subtotal</span>
                                    <span className="text-zinc-300 font-mono">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs mb-3">
                                    <span className="text-zinc-400">VAT (22%)</span>
                                    <span className="text-zinc-300 font-mono">${taxAmount.toFixed(2)}</span>
                                </div>
                                <div className="h-px bg-zinc-800 mb-3"></div>
                                <div className="flex justify-between items-center text-sm font-bold">
                                    <span className="text-white">Total Due</span>
                                    <span className="text-white font-mono">${totalDue.toFixed(2)}</span>
                                </div>
                             </div>
                        </div>

                        <button 
                            disabled={totalDue <= 0}
                            className={`w-full py-3 font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-all
                            ${totalDue > 0 
                                ? "bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/5" 
                                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"}
                            `}
                        >
                            Pay ${totalDue.toFixed(2)} <ArrowRight size={16} />
                        </button>
                        
                        <div className="flex items-start gap-2 mt-4 text-[10px] text-zinc-500 bg-zinc-900/30 p-2 rounded border border-zinc-800/50">
                            <Info size={12} className="shrink-0 mt-0.5" />
                            <p>One-time payment. Tokens are non-refundable and do not expire.</p>
                        </div>
                    </div>

                    <div className="text-center">
                        <button className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-1 mx-auto transition-colors">
                            <History size={12} /> View Purchase History
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}