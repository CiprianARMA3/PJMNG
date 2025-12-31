'use client';

import React, { useMemo, memo, useState, useTransition } from 'react';
import { 
  ArrowRight, 
  Check, 
  X, 
  Loader2, 
  CheckCircle2, 
  Minus, 
  Terminal, 
  Zap,
  ChevronDown
} from 'lucide-react';
import { createSubscriptionCheckout } from "@/app/actions/stripe"; // Ensure this path is correct for your project
import { PLAN_UUIDS } from '@/utils/stripe/config'; // Ensure this path is correct

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

const PLAN_MAPPING: Record<string, string> = {
  'Individual': PLAN_UUIDS.INDIVIDUAL,
  'Developers': PLAN_UUIDS.DEVELOPERS,
  'Enterprise': PLAN_UUIDS.ENTERPRISE
};

const PLAN_ORDER = ["Individual", "Developers", "Enterprise"];

// --- 1. SUPERCHARGED CONFIRMATION MODAL ---
function ConfirmationModal({
  isOpen, onClose, onConfirm, isLoading, isSuccess, planName, price, isUpgrade
}: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#0A0A0A] border-2 border-zinc-100 dark:border-zinc-800 rounded-[40px] shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 p-8 md:p-10 relative flex flex-col items-center text-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.03] pointer-events-none" />
        
        {isSuccess ? (
          <div className="animate-in zoom-in duration-300 relative z-10">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 mx-auto shadow-lg shadow-emerald-100 dark:shadow-none">
              <CheckCircle2 size={40} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white mb-2 uppercase">Protocol Updated</h3>
            <p className="text-zinc-500 dark:text-zinc-400 font-bold text-sm mb-6 leading-relaxed">Identity synced with new tier nodes.</p>
            <Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto" />
          </div>
        ) : (
          <div className="relative z-10 w-full">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 mx-auto ${isUpgrade ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600'}`}>
              <Zap size={32} strokeWidth={2.5} fill="currentColor" />
            </div>
            <h3 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white mb-4 uppercase">
              Confirm {isUpgrade ? 'Upgrade' : 'Downgrade'}
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-bold leading-relaxed mb-8">
              Transitioning session to <span className="text-zinc-900 dark:text-white">{planName}</span>. 
              {isUpgrade ? " Prorated charges apply immediately." : " Changes reflect next cycle."}
            </p>
            <div className="grid grid-cols-2 gap-4 w-full">
              <button onClick={onClose} disabled={isLoading} className="py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border-2 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all disabled:opacity-50">Cancel</button>
              <button onClick={onConfirm} disabled={isLoading} className={`py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white transition-all shadow-xl disabled:opacity-50 ${isUpgrade ? 'bg-purple-600 shadow-purple-200 dark:shadow-none' : 'bg-zinc-900 dark:bg-white dark:text-black shadow-zinc-200 dark:shadow-none'}`}>
                {isLoading ? <Loader2 className="animate-spin mx-auto w-4 h-4" /> : "Authorize"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- 2. SUPERCHARGED FEATURE VALUE ---
const FeatureValue = memo(({ value }: { value: string | boolean | number }) => {
  if (typeof value === 'boolean') {
    return value ? (
      <div className="bg-purple-600 p-1 rounded-lg shadow-sm shadow-purple-200 dark:shadow-none shrink-0"><Check size={12} className="text-white" strokeWidth={4} /></div>
    ) : (
      <Minus size={16} className="text-zinc-200 dark:text-zinc-800 shrink-0" strokeWidth={3} />
    );
  }
  return <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100 text-right">{value}</span>;
});
FeatureValue.displayName = 'FeatureValue';

// --- DATA ---
const defaultTiers: PricingTier[] = [
  {
    name: 'Individual',
    price: { month: 15, year: 150 },
    ctaText: 'Get started',
    features: {
      productivity: 'Standard suite', ai_assistant: 'Standard Support', integrated_calendar: true,
      collaboration: 'Single-user', max_users: 1, development_tools: 'Standard toolkit',
      code_linking: true, ai_project_helper: true, code_review_dashboard: true,
      project_management: 'Basic tools', max_projects: 5, issue_tracking: true,
      concept_workspace: true, task_organization: true
    }
  },
  {
    name: 'Developers',
    price: { month: 30, year: 300 },
    ctaText: 'Get started',
    features: {
      productivity: 'Enhanced suite', ai_assistant: 'Full Support', integrated_calendar: true,
      collaboration: 'Team (Max 50)', max_users: 50, development_tools: 'Advanced assistance',
      code_linking: true, ai_project_helper: true, code_review_dashboard: true,
      project_management: 'Complete tools', max_projects: 10, issue_tracking: true,
      concept_workspace: true, task_organization: true
    }
  },
  {
    name: 'Enterprise',
    price: { month: 200, year: 2000 },
    ctaText: 'Contact sales',
    features: {
      productivity: 'Enterprise suite', ai_assistant: 'Priority Support', integrated_calendar: true,
      collaboration: 'Unlimited', max_users: 'Unlimited', development_tools: 'Full ecosystem',
      code_linking: true, max_projects: 'Unlimited', ai_project_helper: true,
      code_review_dashboard: true, project_management: 'Advanced analytics',
      unlimited_projects: true, issue_tracking: true, concept_workspace: true,
      task_organization: true, cost_optimization: 'Optimized pricing', reduced_token_costs: true
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
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string, price: string } | null>(null);

  // Accordion state for mobile view
  const [openMobileCategories, setOpenMobileCategories] = useState<Record<string, boolean>>({});

  const toggleMobileCategory = (planName: string, categoryName: string) => {
    const key = `${planName}-${categoryName}`;
    setOpenMobileCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectPlan = (tier: PricingTier) => {
    const priceAmount = billingInterval === 'month' ? tier.price.month : tier.price.year;
    setSelectedPlan({ name: tier.name, price: `€${priceAmount}/${billingInterval}` });
    setIsSuccess(false);
    setModalOpen(true);
  };

  const confirmSubscription = async () => {
    if (!selectedPlan) return;
    startTransition(async () => {
      try {
        const planId = PLAN_MAPPING[selectedPlan.name];
        if (planId) await createSubscriptionCheckout(planId, billingInterval);
      } catch (error: any) {
        if (error.message === 'NEXT_REDIRECT') {
          setIsSuccess(true);
          setTimeout(() => window.location.reload(), 2000);
          return;
        }
        setModalOpen(false);
      }
    });
  };

  const isUpgrade = useMemo(() => {
    if (!currentPlanName || !selectedPlan) return true;
    return PLAN_ORDER.indexOf(selectedPlan.name) > PLAN_ORDER.indexOf(currentPlanName);
  }, [currentPlanName, selectedPlan]);

  return (
    <div className={`w-full max-w-[1400px] mx-auto px-4 ${className}`}>
      
      {/* Supercharged Toggle */}
      <div className="flex justify-center mb-10 md:mb-16">
        <div className="bg-white dark:bg-zinc-900 p-1 md:p-1.5 rounded-full border-2 border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none flex relative">
          <button
            onClick={() => setBillingInterval('month')}
            className={`px-6 md:px-10 py-2 md:py-3 text-[10px] font-black uppercase tracking-widest rounded-full transition-all z-10 ${billingInterval === 'month' ? 'text-white bg-[#202124] dark:bg-white dark:text-black' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('year')}
            className={`px-6 md:px-10 py-2 md:py-3 text-[10px] font-black uppercase tracking-widest rounded-full transition-all z-10 flex items-center gap-2 ${billingInterval === 'year' ? 'text-white bg-[#202124] dark:bg-white dark:text-black' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
          >
            Yearly <span className={`hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded font-black ${billingInterval === 'year' ? 'bg-white/20 dark:bg-black/10' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>-17%</span>
          </button>
        </div>
      </div>

      {/* --- DESKTOP VIEW (MATRIX) --- */}
      <div className="hidden lg:block bg-white dark:bg-[#0A0A0A] border-2 border-zinc-100 dark:border-zinc-800 rounded-[40px] overflow-hidden shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 relative">
        <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.02] dark:opacity-[0.03] pointer-events-none" />

        {/* Header Grid */}
        <div className="grid grid-cols-4 bg-zinc-50 dark:bg-zinc-900/50 border-b-2 border-zinc-100 dark:border-zinc-800 relative z-10">
          <div className="p-8 flex flex-col justify-end">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 dark:text-zinc-500">
              <Terminal size={14} strokeWidth={3} /> Matrix
            </div>
          </div>

          {tiers?.map((tier) => {
            const isCurrent = currentPlanName?.toLowerCase() === tier.name.toLowerCase();
            const isDev = tier.name === 'Developers';

            return (
              <div key={tier.name} className={`p-8 text-center border-l-2 border-zinc-100 dark:border-zinc-800 flex flex-col items-center ${isCurrent ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : isDev ? 'bg-purple-50/30 dark:bg-purple-900/10' : ''}`}>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                    {tier.name}
                    {isCurrent && <CheckCircle2 size={14} className="text-emerald-500" strokeWidth={3} />}
                </h4>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white">
                    €{billingInterval === 'month' ? tier.price.month : Math.round(tier.price.year / 12)}
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-600 text-[10px] font-black uppercase tracking-widest">/mo</span>
                </div>
                

              </div>
            );
          })}
        </div>

        {/* Categories & Features Rows */}
        <div className="relative z-10">
          {featureCategories.map((category) => (
            <React.Fragment key={category.name}>
              <div className="bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm p-4 px-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500 border-b-2 border-zinc-100 dark:border-zinc-800">
                {category.name}
              </div>

              {category.features.map((feature) => (
                <div key={feature.key} className="grid grid-cols-4 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/30 transition-colors group border-b-2 border-zinc-50 dark:border-zinc-900 last:border-b-0">
                  <div className="p-6 px-8 text-[13px] font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors flex items-center">
                    {feature.label}
                  </div>
                  {tiers?.map((tier) => (
                    <div key={`${tier.name}-${feature.key}`} className={`p-6 border-l-2 border-zinc-100 dark:border-zinc-800 flex items-center justify-center ${tier.name === 'Developers' ? 'bg-purple-50/10 dark:bg-purple-900/5' : ''}`}>
                      <FeatureValue value={tier.features[feature.key]} />
                    </div>
                  ))}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* --- MOBILE VIEW (STACKED CARDS) --- */}
      <div className="lg:hidden flex flex-col gap-6">
        {tiers?.map((tier) => {
          const isCurrent = currentPlanName?.toLowerCase() === tier.name.toLowerCase();
          const isDev = tier.name === 'Developers';
          
          return (
            <div key={tier.name} className="bg-white dark:bg-[#0A0A0A] border-2 border-zinc-100 dark:border-zinc-800 rounded-[32px] overflow-hidden shadow-lg relative">
               <div className="absolute inset-0 bg-[url('/grainy.png')] opacity-[0.02] dark:opacity-[0.03] pointer-events-none" />
               
               <div className={`p-6 relative z-10 ${isCurrent ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : isDev ? 'bg-purple-50/30 dark:bg-purple-900/10' : ''}`}>
                 <div className="flex justify-between items-start mb-4">
                   <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-white flex items-center gap-2">
                      {tier.name}
                      {isCurrent && <CheckCircle2 size={14} className="text-emerald-500" strokeWidth={3} />}
                   </h4>
                   {isDev && <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 rounded text-[9px] font-black uppercase tracking-wide">Popular</span>}
                 </div>
                 
                 <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white">
                      €{billingInterval === 'month' ? tier.price.month : Math.round(tier.price.year / 12)}
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-600 text-[10px] font-black uppercase tracking-widest">/mo</span>
                 </div>
               </div>

               {/* Mobile Features List */}
               <div className="bg-zinc-50/50 dark:bg-zinc-900/30">
                 {featureCategories.map((category) => {
                   const isOpen = openMobileCategories[`${tier.name}-${category.name}`];
                   
                   return (
                     <div key={category.name} className="border-t border-zinc-100 dark:border-zinc-800">
                        <button 
                          onClick={() => toggleMobileCategory(tier.name, category.name)}
                          className="w-full flex items-center justify-between p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                          {category.name}
                          <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                          <div className="bg-white dark:bg-black/20 p-4 pt-0 grid gap-3 pb-6">
                            {category.features.map((feature) => (
                              <div key={feature.key} className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500 dark:text-zinc-400 font-medium text-xs">{feature.label}</span>
                                <FeatureValue value={tier.features[feature.key]} />
                              </div>
                            ))}
                          </div>
                        </div>
                     </div>
                   );
                 })}
               </div>
            </div>
          );
        })}
      </div>

      <ConfirmationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={confirmSubscription}
        isLoading={isPending}
        isSuccess={isSuccess}
        planName={selectedPlan?.name}
        isUpgrade={isUpgrade}
      />

    </div>
  );
};

export default memo(PricingTable);