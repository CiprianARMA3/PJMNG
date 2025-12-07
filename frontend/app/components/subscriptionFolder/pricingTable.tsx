'use client';

import React, { useMemo, memo, useState } from 'react';
import { ArrowRight, Check, X, HelpCircle, Loader2 } from 'lucide-react';
import { createSubscriptionCheckout } from "@/app/actions/stripe";
import { PLAN_UUIDS } from '@/utils/stripe/config'; 

// Types
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
}

// Map Plan Names to UUIDs (from your safe config)
const PLAN_MAPPING: Record<string, string> = {
  'Individual': PLAN_UUIDS.INDIVIDUAL,
  'Developers': PLAN_UUIDS.DEVELOPERS,
  'Enterprise': PLAN_UUIDS.ENTERPRISE
};

// --- SUB-COMPONENTS ---

const Tooltip = memo(({ content }: { content: string }) => (
  <div className="relative flex group">
    <HelpCircle className="w-5 h-5 text-gray-400 cursor-help" />
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-[#1a1a1a] rounded-lg text-white text-sm w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
      <p className="m-0">{content}</p>
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[#1a1a1a]"></div>
    </div>
  </div>
));
Tooltip.displayName = 'Tooltip';

const FeatureValue = memo(({ value }: { value: string | boolean | number }) => {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
    ) : (
      <X className="w-5 h-5 text-zinc-600 flex-shrink-0" />
    );
  }
  return <p className="text-zinc-300 text-sm text-center m-0">{value}</p>;
});
FeatureValue.displayName = 'FeatureValue';

const SubscribeButton = ({ tier, interval }: { tier: PricingTier; interval: 'month' | 'year' }) => {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    const planId = PLAN_MAPPING[tier.name];
    if (!planId) return;

    setLoading(true);
    try {
      await createSubscriptionCheckout(planId, interval);
    } catch (error: any) {
      alert(error.message || "An error occurred.");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className={`
        w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all font-medium text-sm
        ${tier.name === 'Developers' 
          ? 'bg-purple-600 hover:bg-purple-700 text-white' 
          : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'}
      `}
    >
      <span>{loading ? "Processing..." : tier.ctaText}</span>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
    </button>
  );
};

// --- DATA ---

const defaultTiers: PricingTier[] = [
  {
    name: 'Individual',
    price: { month: 15, year: 150 },
    ctaText: 'Get started',
    features: {
      productivity: 'Enhanced productivity',
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
      productivity: 'Enhanced productivity',
      ai_assistant: 'Full Support',
      integrated_calendar: true,
      collaboration: 'Multi-user',
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
      { key: 'unlimited_projects', label: 'Unlimited projects' },
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

const PricingTable: React.FC<PricingTableProps> = ({ tiers = defaultTiers, className = '' }) => {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const safeTiers = useMemo(() => tiers || defaultTiers, [tiers]);

  const isDevelopersTier = useMemo(() => (name: string) => name === 'Developers', []);

  return (
    <div className={`w-full text-white font-sans ${className}`}>
      
      {/* Interval Toggle */}
      <div className="flex justify-center mb-10">
        <div className="bg-zinc-900 p-1 rounded-xl border border-zinc-800 flex relative">
          <button
            onClick={() => setBillingInterval('month')}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-all z-10 ${
              billingInterval === 'month' ? 'text-white bg-zinc-700 shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('year')}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-all z-10 ${
              billingInterval === 'year' ? 'text-white bg-zinc-700 shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Yearly <span className="text-[10px] text-green-400 ml-1 font-bold">SAVE 17%</span>
          </button>
        </div>
      </div>

      {/* Header Grid */}
      <div className="grid grid-cols-4 border border-zinc-800 rounded-t-2xl overflow-hidden">
        <div className="p-6 border-r border-zinc-800 bg-zinc-900/30 flex items-end pb-8">
          <span className="text-zinc-500 font-medium">Plans & Features</span>
        </div>
        
        {safeTiers.map((tier) => (
          <div
            key={tier.name}
            className={`p-6 border-r border-zinc-800 last:border-r-0 flex flex-col items-center text-center relative ${
              isDevelopersTier(tier.name) ? 'bg-zinc-900/50' : ''
            }`}
          >
             {isDevelopersTier(tier.name) && (
              <div className="absolute top-0 inset-x-0 h-1 bg-purple-600"></div>
            )}

            <h4 className="text-lg font-semibold mb-2">{tier.name}</h4>
            
            <div className="mb-6 h-12 flex items-end justify-center gap-1">
              <span className="text-3xl font-bold">
                €{billingInterval === 'month' ? tier.price.month : Math.round(tier.price.year / 12)}
              </span>
              <span className="text-zinc-500 text-sm mb-1">/mo</span>
            </div>
            
            {billingInterval === 'year' && (
              <div className="text-xs text-green-500 mb-4 font-medium">
                Billed €{tier.price.year} yearly
              </div>
            )}

            <SubscribeButton tier={tier} interval={billingInterval} />
          </div>
        ))}
      </div>

      {/* Feature Grid */}
      <div className="border-x border-b border-zinc-800 rounded-b-2xl overflow-hidden">
        {featureCategories.map((category) => (
          <div key={category.name}>
            <div className="bg-zinc-900/80 p-3 pl-6 text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
              {category.name}
            </div>

            {category.features.map((feature) => (
              <div key={feature.key} className="grid grid-cols-4 group hover:bg-zinc-900/20 transition-colors">
                <div className="p-4 text-sm text-zinc-400 flex items-center border-r border-zinc-800 border-b border-zinc-800/50">
                  {feature.label}
                </div>
                {safeTiers.map((tier) => (
                  <div
                    key={`${tier.name}-${feature.key}`}
                    className={`p-4 flex items-center justify-center border-r border-zinc-800 border-b border-zinc-800/50 last:border-r-0 ${
                      isDevelopersTier(tier.name) ? 'bg-zinc-900/20' : ''
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
    </div>
  );
};

export default memo(PricingTable);