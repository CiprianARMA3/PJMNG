"use client";
import { useState, useEffect, useCallback, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import PRICING_TABLE from "./pricingTable";
import { ChevronRight, Loader2, CheckCircle2, ArrowUpCircle, ArrowDownCircle, AlertTriangle, X } from "lucide-react";
import { createSubscriptionCheckout } from "@/app/actions/stripe";
import { getUserSubscriptionData } from "@/app/actions/getUserSubscriptionData";
import { PLAN_UUIDS } from "@/utils/stripe/config";

interface Plan {
  id: string;
  name: string;
  monthly_price: number;
  yearly_price: number;
  features: string[];
  recommended?: boolean;
}

// Map Plan Names (from DB) to Config UUIDs
const PLAN_MAPPING: Record<string, string> = {
  'Individual': PLAN_UUIDS.INDIVIDUAL,
  'Developers': PLAN_UUIDS.DEVELOPERS,
  'Enterprise': PLAN_UUIDS.ENTERPRISE
};

// Define Hierarchy for Upgrade/Downgrade logic
const PLAN_ORDER = ["Individual", "Developers", "Enterprise"];

const supabase = createClient();

// --- MODAL COMPONENT WITH DOUBLE CONFIRMATION (RESTORED FULL VERSION) ---
function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  isSuccess,
  planName,
  price,
  isUpgrade
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  isSuccess: boolean;
  planName: string;
  price: string;
  isUpgrade: boolean;
}) {
  const [step, setStep] = useState<'initial' | 'final'>('initial');
  const [confirmText, setConfirmText] = useState('');

  // Reset state when modal closes or opens
  useEffect(() => {
    if (!isOpen) {
      setStep('initial');
      setConfirmText('');
    }
  }, [isOpen]);

  const handleFirstConfirm = () => {
    setStep('final');
  };

  const handleFinalConfirm = () => {
    if (confirmText.toUpperCase() === 'CONFIRM') {
      onConfirm();
    }
  };

  const handleClose = () => {
    setStep('initial');
    setConfirmText('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 light:bg-white/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#111] light:bg-white border border-zinc-800 light:border-gray-200 rounded-2xl shadow-2xl p-8 relative flex flex-col items-center text-center">

        {/* --- SUCCESS STATE --- */}
        {isSuccess ? (
          <div className="animate-in zoom-in duration-300 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-white light:text-black mb-2">Subscription Updated!</h3>
            <p className="text-zinc-400 light:text-zinc-600 mb-6">
              Your plan has been successfully changed. <br />Reloading page...
            </p>
            <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
          </div>
        ) : step === 'initial' ? (
          /* --- FIRST CONFIRMATION STATE --- */
          <>
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-zinc-500 light:text-zinc-400 hover:text-white light:hover:text-black transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>

            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 ${isUpgrade ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="mb-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-xs font-medium">
              Step 1 of 2
            </div>

            <h3 className="text-xl font-bold text-white light:text-black mb-3">
              Confirm {isUpgrade ? 'Upgrade' : 'Downgrade'}
            </h3>

            <p className="text-zinc-400 light:text-zinc-600 text-sm leading-relaxed mb-8">
              You are about to switch to the <span className="text-white light:text-black font-semibold">{planName}</span> plan.
              <br />
              {isUpgrade ? (
                <span className="text-blue-400 mt-2 block text-xs bg-blue-500/5 py-1 px-2 rounded border border-blue-500/10">
                  You will be charged a prorated amount of approx <b>{price}</b> immediately.
                </span>
              ) : (
                <span className="text-orange-400 mt-2 block text-xs bg-orange-500/5 py-1 px-2 rounded border border-orange-500/10">
                  Your new rate will apply at the start of the next billing cycle.
                </span>
              )}
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 py-3 rounded-xl font-medium text-sm bg-zinc-900 light:bg-gray-100 text-zinc-300 light:text-zinc-700 hover:bg-zinc-800 light:hover:bg-gray-200 hover:text-white light:hover:text-black transition-colors border border-zinc-800 light:border-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleFirstConfirm}
                disabled={isLoading}
                className={`flex-1 py-3 rounded-xl font-medium text-sm text-white transition-all flex items-center justify-center gap-2 ${isUpgrade
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20'
                  : 'bg-zinc-700 light:bg-zinc-200 hover:bg-zinc-600 light:hover:bg-zinc-300 light:text-black'
                  }`}
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          /* --- SECOND CONFIRMATION STATE --- */
          <>
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-zinc-500 light:text-zinc-400 hover:text-white light:hover:text-black transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5 bg-red-500/10 text-red-500">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="mb-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-xs font-medium">
              Step 2 of 2 - Final Confirmation
            </div>

            <h3 className="text-xl font-bold text-white light:text-black mb-3">
              Are you absolutely sure?
            </h3>

            <p className="text-zinc-400 light:text-zinc-600 text-sm leading-relaxed mb-4">
              This action will {isUpgrade ? 'upgrade' : 'downgrade'} your subscription to <span className="text-white light:text-black font-semibold">{planName}</span>.
            </p>

            <div className="w-full mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-xs mb-3 font-medium">
                ⚠️ To proceed, please type <span className="text-white light:text-black font-bold">CONFIRM</span> below:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type CONFIRM"
                className="w-full px-4 py-2 bg-black/50 light:bg-white border border-zinc-700 light:border-zinc-300 rounded-lg text-white light:text-black text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                autoFocus
              />
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setStep('initial')}
                disabled={isLoading}
                className="flex-1 py-3 rounded-xl font-medium text-sm bg-zinc-900 light:bg-gray-100 text-zinc-300 light:text-zinc-700 hover:bg-zinc-800 light:hover:bg-gray-200 hover:text-white light:hover:text-black transition-colors border border-zinc-800 light:border-gray-200"
              >
                Back
              </button>
              <button
                onClick={handleFinalConfirm}
                disabled={isLoading || confirmText.toUpperCase() !== 'CONFIRM'}
                className={`flex-1 py-3 rounded-xl font-medium text-sm text-white transition-all flex items-center justify-center gap-2 ${confirmText.toUpperCase() === 'CONFIRM' && !isLoading
                  ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/20'
                  : 'bg-zinc-800 cursor-not-allowed opacity-50'
                  }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Confirm Change</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

const CheckIcon = ({ highlight = false }: { highlight?: boolean }) => (
  <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-lg flex items-center justify-center ${highlight ? 'bg-purple-600 text-white' : 'bg-green-100 text-green-600'}`}>
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex flex-col justify-center items-center h-64 text-white gap-4">
    <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
    <p className="text-zinc-400 light:text-zinc-600 text-sm">Loading subscription details...</p>
  </div>
);

const ToggleButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode; }) => (
  <button
    onClick={onClick}
    className={`relative z-10 px-10 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-300 cursor-pointer ${active
      ? "text-white"
      : "text-zinc-500 hover:text-[#202124]"
      }`}
  >
    {children}
  </button>
);

const FeatureItem = ({ feature, highlight = false }: { feature: string; highlight?: boolean }) => (
  <li className="flex items-start gap-4">
    <CheckIcon highlight={highlight} />
    <span className="text-[14px] font-bold text-zinc-600 leading-tight">{feature}</span>
  </li>
);

// --- Pricing Card (UPDATED) ---
const PricingCard = ({
  plan,
  isMonthly,
  currentPlanName,
  currentInterval, // Added Prop
  onSelect
}: {
  plan: Plan;
  isMonthly: boolean;
  currentPlanName: string | null;
  currentInterval: 'month' | 'year' | null; // Added Type
  onSelect: () => void;
}) => {
  // Normalize names for comparison
  const planName = plan.name;
  const currentName = currentPlanName || "";

  // 1. Name matches
  const isPlanNameMatch = currentName.toLowerCase() === planName.toLowerCase();

  // 2. Exact match check (Name + Interval match)
  // If isMonthly toggle is TRUE, we check if user has 'month'.
  // If isMonthly toggle is FALSE, we check if user has 'year'.
  const isExactCurrentPlan = isPlanNameMatch && (
    (isMonthly && currentInterval === 'month') ||
    (!isMonthly && currentInterval === 'year')
  );

  // Determine Rank
  const currentRank = PLAN_ORDER.indexOf(currentName); // -1 if no plan
  const planRank = PLAN_ORDER.indexOf(planName);

  // Determine Button State
  let buttonText = "Get Started";
  let buttonStyle = plan.recommended
    ? "bg-[#202124] text-white hover:bg-black shadow-xl shadow-zinc-900/20"
    : "bg-zinc-50 text-[#202124] hover:bg-zinc-100 border-2 border-transparent hover:border-zinc-200";
  let isDisabled = false;

  if (isExactCurrentPlan) {
    // Case 1: Exact Match (Same Plan + Same Interval)
    buttonText = "Current Plan";
    buttonStyle = "bg-green-50 text-green-600 cursor-default border-2 border-green-200";
    isDisabled = true;
  } else if (isPlanNameMatch) {
    // Case 2: Same Plan, Different Interval (Switching)
    buttonText = "Switch to " + (isMonthly ? "Monthly" : "Yearly");
    buttonStyle = "bg-[#202124] text-white hover:bg-black cursor-pointer shadow-xl shadow-zinc-900/20";
  } else if (currentRank !== -1) {
    // Case 3: Different Plan (Upgrade/Downgrade)
    if (planRank > currentRank) {
      buttonText = "Upgrade";
      buttonStyle = "bg-[#202124] text-white hover:bg-black cursor-pointer shadow-xl shadow-zinc-900/20";
    } else {
      buttonText = "Downgrade";
      buttonStyle = "bg-zinc-100 text-zinc-600 border-2 border-zinc-200 hover:bg-zinc-200 cursor-pointer";
    }
  }

  return (
    <div
      className={`relative p-10 rounded-[40px] bg-white border-2 transition-all duration-500 overflow-visible group flex flex-col h-full ${plan.recommended && !isExactCurrentPlan && plan.name !== 'Enterprise'
        ? "border-purple-600 shadow-2xl shadow-purple-900/10 scale-105 z-10"
        : isExactCurrentPlan
          ? "border-green-500 shadow-2xl shadow-green-900/10"
          : "border-zinc-100 shadow-xl shadow-zinc-200/50 hover:border-purple-200 hover:shadow-2xl z-0"
        }`}
    >
      {/* Active Badge - Centered on top border */}
      {isExactCurrentPlan && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-full flex items-center gap-1.5 shadow-lg shadow-green-500/30 z-20 whitespace-nowrap">
          <CheckCircle2 size={12} /> Active
        </div>
      )}

      {/* Most Popular Badge - Centered on top border */}
      {plan.recommended && !isExactCurrentPlan && plan.name !== 'Enterprise' && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-purple-500/30 whitespace-nowrap z-20">
          Most Popular
        </div>
      )}

      {/* GRAIN TEXTURE */}
      <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] mix-blend-multiply pointer-events-none rounded-[40px]" />

      <div className="flex flex-col h-full relative z-10">

        <div className="mb-10">
          <h3 className="text-2xl font-black tracking-tight text-[#202124] mb-2">{plan.name}</h3>
          <p className="text-sm text-zinc-500 font-bold mb-8">
            {plan.name === 'Individual' ? 'For individual developers' :
              plan.name === 'Developers' ? 'For growing teams & startups' :
                'For large organizations'}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-black text-[#202124] tracking-tighter">
              €{isMonthly ? plan.monthly_price : plan.yearly_price}
            </span>
            <span className="text-zinc-400 font-black uppercase tracking-widest text-xs">
              {isMonthly ? "/mo" : "/year"}
            </span>
          </div>
        </div>

        <div className="space-y-5 mb-12 flex-grow">
          {plan.features.map((feature, index) => (
            <FeatureItem key={`${plan.id}-${index}`} feature={feature} highlight={plan.recommended} />
          ))}
        </div>

        <button
          type="button"
          onClick={onSelect}
          disabled={isDisabled}
          className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 ${buttonStyle} ${isDisabled ? 'cursor-default' : 'cursor-pointer'}`}
        >
          {buttonText.startsWith("Switch") && <ArrowUpCircle size={14} strokeWidth={3} />}
          {buttonText === "Upgrade" && <ArrowUpCircle size={14} strokeWidth={3} />}
          {buttonText === "Downgrade" && <ArrowDownCircle size={14} strokeWidth={3} />}
          {buttonText}
          {!isDisabled && buttonText === "Get Started" && <ChevronRight size={14} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />}
        </button>
      </div>
    </div>
  );
};

// --- Main Container ---

export default function PricingInterface() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isMonthly, setIsMonthly] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [currentInterval, setCurrentInterval] = useState<'month' | 'year' | null>(null); // Added State

  // MODAL STATE (Keeping original modal logic)
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string, price: string } | null>(null);

  const parseFeatures = useCallback((features: any): string[] => {
    let parsedFeatures: any = {};
    const featuresList: string[] = [];
    if (typeof features === "string") {
      try { parsedFeatures = JSON.parse(features); } catch { parsedFeatures = {}; }
    } else if (typeof features === "object" && features !== null) {
      parsedFeatures = features;
    }
    if (parsedFeatures.features && typeof parsedFeatures.features === "object") {
      Object.values(parsedFeatures.features).forEach((section: any) => {
        if (section.description) featuresList.push(section.description);
      });
    }
    if (parsedFeatures.ai_capabilities && Array.isArray(parsedFeatures.ai_capabilities)) {
      featuresList.push(...parsedFeatures.ai_capabilities.slice(0, 2));
    }
    return featuresList;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Plans from DB
        const { data: plansData, error: plansError } = await supabase
          .from("plans")
          .select("id, name, monthly_price, yearly_price, features");

        if (plansError) throw plansError;

        // 2. Fetch User's Real Subscription Info
        const subscriptionData = await getUserSubscriptionData();
        if (subscriptionData?.planName && subscriptionData.subscription_status === 'active') {
          setCurrentPlan(subscriptionData.planName);
          setCurrentInterval(subscriptionData.interval); // Set Interval

          // Optional: Auto-switch toggle to match user
          if (subscriptionData.interval === 'year') {
            setIsMonthly(false);
          }
        }

        const mappedPlans: Plan[] = (plansData || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          monthly_price: p.monthly_price,
          yearly_price: p.yearly_price,
          features: parseFeatures(p.features),
          recommended: p.name === "Developers",
        }));

        const sortedPlans = mappedPlans.sort(
          (a, b) => PLAN_ORDER.indexOf(a.name) - PLAN_ORDER.indexOf(b.name)
        );

        setPlans(sortedPlans);
      } catch (err) {
        console.error("Error fetching pricing data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [parseFeatures]);

  // --- Handlers ---
  const handleSelectPlan = (plan: Plan) => {
    // If using the Modal logic:
    // setSelectedPlan({ name: plan.name, price: isMonthly ? `€${plan.monthly_price}` : `€${plan.yearly_price}` });
    // setModalOpen(true);

    // If using direct Checkout redirect (as per previous logic):
    const planId = plan.id;
    const interval = isMonthly ? 'month' : 'year';
    router.push(`/dashboard/checkout?planId=${planId}&interval=${interval}`);
  };

  const confirmSubscription = async () => {
    if (!selectedPlan) return;
    startTransition(async () => {
      try {
        const planId = PLAN_MAPPING[selectedPlan.name];
        if (planId) {
          await createSubscriptionCheckout(planId, isMonthly ? 'month' : 'year');
        }
      } catch (error: any) {
        if (error.message === 'NEXT_REDIRECT') {
          setIsSuccess(true);
          setTimeout(() => { window.location.reload(); }, 2000);
          return;
        }
        alert(error.message);
        setModalOpen(false);
      }
    });
  };

  const isUpgrade = useMemo(() => {
    if (!currentPlan || !selectedPlan) return true;
    const currentRank = PLAN_ORDER.indexOf(currentPlan);
    const newRank = PLAN_ORDER.indexOf(selectedPlan.name);
    return newRank > currentRank;
  }, [currentPlan, selectedPlan]);


  if (loading)
    return (
      <div role="status" className="flex justify-center items-center h-screen">
        <svg
          aria-hidden="true"
          className="inline w-8 h-8 text-neutral-400 animate-spin fill-white"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-8 animate-in fade-in duration-700">

      {/* Confirmation Modal (Inserted back) */}
      <ConfirmationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={confirmSubscription}
        isLoading={isPending}
        isSuccess={isSuccess}
        planName={selectedPlan?.name || ''}
        price={selectedPlan?.price || ''}
        isUpgrade={isUpgrade}
      />

      {/* Supercharged Toggle */}
      <div className="flex justify-center mb-12">
        <div className="inline-grid grid-cols-2 bg-white p-1.5 rounded-full border-2 border-zinc-100 shadow-xl shadow-zinc-200/50 relative">
          <div
            className={`absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] bg-[#202124] rounded-full transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${!isMonthly ? 'translate-x-full' : 'translate-x-0'}`}
          />
          <ToggleButton active={isMonthly} onClick={() => setIsMonthly(true)}>
            Monthly
          </ToggleButton>
          <ToggleButton active={!isMonthly} onClick={() => setIsMonthly(false)}>
            <span className="flex items-center justify-center gap-2">
              Yearly
              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${!isMonthly ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'}`}>
                -17%
              </span>
            </span>
          </ToggleButton>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {plans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            isMonthly={isMonthly}
            currentPlanName={currentPlan}
            currentInterval={currentInterval} // Pass current interval
            onSelect={() => handleSelectPlan(plan)}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="flex flex-col justify-center items-center mt-20 mb-10 gap-4">
        <div className="h-1 w-12 bg-zinc-100 rounded-full" />
        <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
          <ChevronRight className="w-3 h-3 text-zinc-400" strokeWidth={3} />
          Detailed Comparison
          <ChevronRight className="w-3 h-3 text-zinc-400 rotate-180" strokeWidth={3} />
        </p>
      </div>

      {/* Table */}
      <PRICING_TABLE currentPlanName={currentPlan} />
    </div>
  );
}