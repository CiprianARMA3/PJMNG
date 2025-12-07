"use client";

import React, { useEffect, use } from "react";
import { Check, ArrowRight, Package, Rocket } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";

export default function PaymentCompletedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();

  useEffect(() => {
    // Trigger Confetti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const random = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    // Refresh the router to ensure the layout/sidebar updates with new token count
    router.refresh();

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0C0C0E] border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-500">
        
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20 shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)]">
          <Check size={40} className="text-green-500" strokeWidth={3} />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
        <p className="text-zinc-400 mb-8">
          Your transaction has been confirmed and the tokens have been added to your project wallet.
        </p>

        <div className="space-y-3">
          <Link 
            href={`/dashboard/projects/${projectId}`}
            className="block w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
          >
            <Rocket size={18} />
            Go to Dashboard
          </Link>

          <Link 
            href={`/dashboard/projects/${projectId}/payments`}
            className="block w-full py-3 bg-zinc-900 text-zinc-300 font-medium rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
          >
            <Package size={18} />
            Buy More Tokens
          </Link>
        </div>

        <div className="mt-8 text-[10px] text-zinc-600">
          Transaction ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
        </div>
      </div>
    </div>
  );
}