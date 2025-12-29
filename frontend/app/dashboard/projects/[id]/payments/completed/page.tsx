"use client";

import React, { useEffect, use, useState, Suspense } from "react";
import { Check, ArrowRight, Package, Rocket, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyTokenPurchase } from "@/app/actions/stripe";

function PaymentCompletedContent({ params }: { params: { id: string } }) {
  const { id: projectId } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      if (!sessionId) {
        setVerifying(false);
        return;
      }

      try {
        const result = await verifyTokenPurchase(sessionId);
        if (!result.success && result.message !== 'Already processed') {
          setError(result.message);
        } else {
          triggerConfetti();
          router.refresh();
        }
      } catch (err) {
        console.error(err);
        setError("Verification failed");
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [sessionId, router]);

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    const random = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400 font-medium">Verifying payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-[#0C0C0E] border border-red-200 dark:border-red-500/20 rounded-2xl p-8 text-center shadow-xl">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={40} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Verification Failed</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">{error}</p>
          <Link
            href={`/dashboard/projects/${projectId}/payments`}
            className="block w-full py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Return to Payments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#0C0C0E] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center shadow-xl animate-in fade-in zoom-in duration-500">

        <div className="w-20 h-20 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-200 dark:border-green-500/20 shadow-sm dark:shadow-[0_0_30px_-5px_rgba(34,197,94,0.3)]">
          <Check size={40} className="text-green-600 dark:text-green-500" strokeWidth={3} />
        </div>

        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Payment Successful!</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Your transaction has been confirmed and the tokens have been added to your project wallet.
        </p>

        <div className="space-y-3">
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="block w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-lg hover:bg-black dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
          >
            <Rocket size={18} />
            Go to Dashboard
          </Link>

          <Link
            href={`/dashboard/projects/${projectId}/payments`}
            className="block w-full py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-300 font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
          >
            <Package size={18} />
            Buy More Tokens
          </Link>
        </div>

        <div className="mt-8 text-[10px] text-zinc-400 dark:text-zinc-600">
          Session ID: {sessionId?.slice(0, 10)}...
        </div>
      </div>
    </div>
  );
}

export default function PaymentCompletedPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <PaymentCompletedContent params={resolvedParams} />
    </Suspense>
  );
}