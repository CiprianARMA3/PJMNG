'use client';

import React, { useMemo, memo, useState, useTransition } from 'react';
import { ArrowRight, Check, X, HelpCircle, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { createSubscriptionCheckout } from "@/app/actions/stripe";
import { PLAN_UUIDS } from '@/utils/stripe/config'; 

// --- TYPES ---
interface PricingTier {
  name: string;
  price: {
    month: number;
    year: number;
  };
  features: {
    [key: string]: string | boolean | number;
  };
  ctaText: string;
}

interface PricingTableProps {
  tiers?: PricingTier[];
  className?: string;
  currentPlanName?: string | null;
}

// Map Names to Config UUIDs
const PLAN_MAPPING: Record<string, string> = {
  'Individual': PLAN_UUIDS.INDIVIDUAL,
  'Developers': PLAN_UUIDS.DEVELOPERS,
  'Enterprise': PLAN_UUIDS.ENTERPRISE
};

const PLAN_ORDER = ["Individual", "Developers", "Enterprise"];

// --- MODAL COMPONENT ---
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#111] border border-zinc-800 rounded-2xl shadow-2xl p-8 relative flex flex-col items-center text-center">
        
        {/* --- SUCCESS STATE --- */}
        {isSuccess ? (
          <div className="animate-in zoom-in duration-300 flex flex-col items-center">
             <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                <CheckCircle2 className="w-8 h-8" />
             </div>
             <h3 className="text-2xl font-bold text-white mb-2">Subscription Updated!</h3>
             <p className="text-zinc-400 mb-6">
               Your plan has been successfully changed. <br/>Reloading page...
             </p>
             <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
          </div>
        ) : (
          /* --- CONFIRMATION STATE --- */
          <>
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>

            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 ${isUpgrade ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
              <AlertTriangle className="w-7 h-7" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-3">
              Confirm {isUpgrade ? 'Upgrade' : 'Downgrade'}
            </h3>
            
            <p className="text-zinc-400 text-sm leading-relaxed mb-8">
              You are about to switch to the <span className="text-white font-semibold">{planName}</span> plan.
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
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-3 rounded-xl font-medium text-sm bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors border border-zinc-800"
              >
                Cancel
              </button>
              <button 
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 py-3 rounded-xl font-medium text-sm text-white transition-all flex items-center justify-center gap-2 ${
                  isUpgrade 
                    ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20' 
                    : 'bg-zinc-700 hover:bg-zinc-600'
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

// --- SUB-COMPONENTS ---

const FeatureValue = memo(({ value }: { value: string | boolean | number }) => {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
    ) : (
      <X className="w-5 h-5 text-zinc-600 flex-shrink-0" />
    );
  }
  return <p className="text-zinc-300 text-sm text-center m-0 font-medium">{value}</p>;
});
FeatureValue.displayName = 'FeatureValue';



// --- DATA ---
const defaultTiers: PricingTier[] = [
  {
    name: 'Individual',
    price: { month: 15, year: 150 },
    ctaText: 'Get started',
    features: {
      productivity: 'Standard suite',
      ai_assistant: 'Standard Support',
      integrated_calendar: true,
      collaboration: 'Single-user',
      max_users: 1,
      development_tools: 'Standard toolkit',
      code_linking: true,
      ai_project_helper: true,
      code_review_dashboard: true,
      project_management: 'Basic tools',
      max_projects: 5,
      issue_tracking: true,
      concept_workspace: true,
      task_organization: true
    }
  },
  {
    name: 'Developers',
    price: { month: 30, year: 300 },
    ctaText: 'Get started',
    features: {
      productivity: 'Enhanced suite',
      ai_assistant: 'Full Support',
      integrated_calendar: true,
      collaboration: 'Team (Max 50)',
      max_users: 50,
      development_tools: 'Advanced assistance',
      code_linking: true,
      ai_project_helper: true,
      code_review_dashboard: true,
      project_management: 'Complete tools',
      max_projects: 10,
      issue_tracking: true,
      concept_workspace: true,
      task_organization: true
    }
  },
  {
    name: 'Enterprise',
    price: { month: 200, year: 2000 },
    ctaText: 'Contact sales',
    features: {
      productivity: 'Enterprise suite',
      ai_assistant: 'Priority Support',
      integrated_calendar: true,
      collaboration: 'Unlimited',
      max_users: 'Unlimited',
      development_tools: 'Full ecosystem',
      code_linking: true,
      max_projects: 'Unlimited',
      ai_project_helper: true,
      code_review_dashboard: true,
      project_management: 'Advanced analytics',
      unlimited_projects: true,
      issue_tracking: true,
      concept_workspace: true,
      task_organization: true,
      cost_optimization: 'Optimized pricing',
      reduced_token_costs: true
    }
  }
];

const featureCategories = [
  {
    name: 'Productivity',
    features: [
      { key: 'productivity', label: 'Productivity suite' },
      { key: 'ai_assistant', label: 'AI Assistant level' },
      { key: 'integrated_calendar', label: 'Integrated calendar' }
    ]
  },
  {
    name: 'Collaboration',
    features: [
      { key: 'collaboration', label: 'Collaboration type' },
      { key: 'max_users', label: 'Max users' }
    ]
  },
  {
    name: 'Development Tools',
    features: [
      { key: 'development_tools', label: 'Development features' },
      { key: 'code_linking', label: 'Code linking' },
      { key: 'ai_project_helper', label: 'AI project helper' },
      { key: 'code_review_dashboard', label: 'Code review dashboard' }
    ]
  },
  {
    name: 'Project Management',
    features: [
      { key: 'project_management', label: 'Project tools' },
      { key: 'max_projects', label: 'Max projects' },
      { key: 'issue_tracking', label: 'Issue tracking' },
      { key: 'concept_workspace', label: 'Concept workspace' },
      { key: 'task_organization', label: 'Task organization' }
    ]
  },
  {
    name: 'Enterprise Exclusive',
    features: [
      { key: 'cost_optimization', label: 'Cost optimization' },
      { key: 'reduced_token_costs', label: 'Reduced token costs' }
    ]
  }
];

// --- MAIN COMPONENT ---

const PricingTable: React.FC<PricingTableProps> = ({ tiers = defaultTiers, className = '', currentPlanName }) => {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const safeTiers = useMemo(() => tiers || defaultTiers, [tiers]);
  
  // MODAL STATE
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // Success state
  const [selectedPlan, setSelectedPlan] = useState<{name: string, price: string} | null>(null);

  const isDevelopersTier = (name: string) => name === 'Developers';

  const handleSelectPlan = (tier: PricingTier) => {
    // 1. Just Open Modal, do NOT charge yet
    const priceAmount = billingInterval === 'month' ? tier.price.month : tier.price.year;
    setSelectedPlan({
      name: tier.name,
      price: `€${priceAmount}/${billingInterval}`
    });
    setIsSuccess(false); // Reset success state
    setModalOpen(true);
  };

  const confirmSubscription = async () => {
    if (!selectedPlan) return;
    
    startTransition(async () => {
      try {
        const planId = PLAN_MAPPING[selectedPlan.name];
        if (planId) {
          await createSubscriptionCheckout(planId, billingInterval);
        }
      } catch (error: any) {
        // Handle "Success" redirect
        if (error.message === 'NEXT_REDIRECT') {
          setIsSuccess(true);
          // Wait 2 seconds for user to see success, then reload
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          return;
        }
        
        alert(error.message);
        setModalOpen(false);
      }
    });
  };

  const isUpgrade = useMemo(() => {
    if (!currentPlanName || !selectedPlan) return true;
    const currentRank = PLAN_ORDER.indexOf(currentPlanName);
    const newRank = PLAN_ORDER.indexOf(selectedPlan.name);
    return newRank > currentRank;
  }, [currentPlanName, selectedPlan]);

  return (
    <div className={`w-full text-white font-sans ${className}`}>
      
      {/* Interval Toggle */}
      <div className="flex justify-center mb-10">
        <div className="bg-zinc-900 p-1.5 rounded-xl border border-zinc-800 flex relative">
          <button
            onClick={() => setBillingInterval('month')}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-all z-10 ${
              billingInterval === 'month' ? 'text-white bg-zinc-700 shadow-sm ring-1 ring-white/5' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('year')}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-all z-10 ${
              billingInterval === 'year' ? 'text-white bg-zinc-700 shadow-sm ring-1 ring-white/5' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Yearly <span className="text-[10px] text-green-400 ml-1 font-bold bg-green-400/10 px-1.5 py-0.5 rounded uppercase tracking-wide">Save 17%</span>
          </button>
        </div>
      </div>

      {/* Header Grid */}
      <div className="grid grid-cols-4 border border-zinc-800 rounded-t-2xl overflow-hidden shadow-2xl bg-[#0A0A0A]">
        <div className="p-6 border-r border-zinc-800 bg-zinc-900/30 flex flex-col justify-end pb-8">
          <span className="text-zinc-400 font-medium text-sm uppercase tracking-wider">Features Comparison</span>
        </div>
        
        {safeTiers.map((tier) => {
          const isCurrent = currentPlanName?.toLowerCase() === tier.name.toLowerCase();
          const isDev = isDevelopersTier(tier.name);

          return (
            <div
              key={tier.name}
              className={`p-6 border-r border-zinc-800 last:border-r-0 flex flex-col items-center text-center relative transition-colors duration-300 ${
                isCurrent ? 'bg-green-900/5' : isDev ? 'bg-zinc-900/20' : ''
              }`}
            >
               {isDev && !isCurrent && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600"></div>
              )}
               {isCurrent && (
                <div className="absolute top-0 inset-x-0 h-1 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]"></div>
              )}

              <h4 className="text-lg font-bold mb-2 flex items-center gap-2 text-white">
                  {tier.name}
                  {isCurrent && <CheckCircle2 size={18} className="text-green-500 fill-green-500/10" />}
              </h4>
              
              <div className="mb-6 h-14 flex flex-col justify-end items-center">
                <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold tracking-tight">
                    €{billingInterval === 'month' ? tier.price.month : Math.round(tier.price.year / 12)}
                    </span>
                    <span className="text-zinc-500 text-sm mb-1 font-medium">/mo</span>
                </div>
                {billingInterval === 'year' && (
                    <div className="text-[11px] text-green-400 font-medium mt-1">
                    Billed €{tier.price.year} yearly
                    </div>
                )}
              </div>
              
              <div className="w-full mt-auto">

              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Grid */}
      <div className="border-x border-b border-zinc-800 rounded-b-2xl overflow-hidden bg-[#0A0A0A]">
        {featureCategories.map((category) => (
          <div key={category.name}>
            <div className="bg-zinc-900/50 p-3 pl-6 text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-800 backdrop-blur-sm sticky top-0">
              {category.name}
            </div>

            {category.features.map((feature) => (
              <div key={feature.key} className="grid grid-cols-4 group hover:bg-white/[0.02] transition-colors">
                <div className="p-4 text-sm text-zinc-400 flex items-center border-r border-zinc-800 border-b border-zinc-800/50 font-medium">
                  {feature.label}
                </div>
                {safeTiers.map((tier) => (
                  <div
                    key={`${tier.name}-${feature.key}`}
                    className={`p-4 flex items-center justify-center border-r border-zinc-800 border-b border-zinc-800/50 last:border-r-0 ${
                       currentPlanName?.toLowerCase() === tier.name.toLowerCase() ? 'bg-green-900/5' : isDevelopersTier(tier.name) ? 'bg-zinc-900/10' : ''
                    }`}
                  >
                    <FeatureValue value={tier.features[feature.key]} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* --- CONFIRMATION MODAL --- */}
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
    </div>
  );
};

export default memo(PricingTable);