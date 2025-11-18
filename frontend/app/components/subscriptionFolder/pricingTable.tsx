import React, { useMemo, memo } from 'react';
import { ArrowRight, Check, X, HelpCircle } from 'lucide-react';

// Types
interface PricingTier {
  name: string;
  features: {
    [key: string]: string | boolean | number;
  };
  ctaLink: string;
  ctaText: string;
}

interface PricingTableProps {
  tiers?: PricingTier[];
  className?: string;
}

// Memoized Tooltip Component
const Tooltip = memo(({ content }: { content: string }) => (
  <div className="relative flex group">
    <HelpCircle className="w-5 h-5 text-gray-400 cursor-help" />
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-[#1a1a1a] rounded-lg text-white text-sm w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
      <p className="m-0">{content}</p>
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[#1a1a1a]"></div>
    </div>
  </div>
));
Tooltip.displayName = 'Tooltip';

// Memoized Feature Value Component
const FeatureValue = memo(({ value }: { value: string | boolean | number }) => {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="w-5 h-5 text-purple-600 flex-shrink-0" />
    ) : (
      <X className="w-5 h-5 text-gray-400 flex-shrink-0" />
    );
  }
  return <p className="text-white text-sm text-center m-0">{value}</p>;
});
FeatureValue.displayName = 'FeatureValue';

// Memoized CTA Link Component
const CtaLink = memo(({ tier }: { tier: PricingTier }) => (
  <a
    href={tier.ctaLink}
    className="flex items-center gap-2 text-white opacity-80 hover:opacity-100 transition-opacity no-underline"
  >
    <span className="text-sm">{tier.ctaText}</span>
    <ArrowRight className="w-4 h-4 flex-shrink-0" />
  </a>
));
CtaLink.displayName = 'CtaLink';

// Constants
const defaultTiers: PricingTier[] = [
  {
    name: 'Individual',
    ctaLink: '#',
    ctaText: 'Get started',
    features: {
      productivity: 'Enhanced productivity features',
      ai_assistant: 'Full Support',
      integrated_calendar: true,
      collaboration: 'Single-user workspace',
      max_users: 1,
      development_tools: 'Full development toolkit',
      code_linking: true,
      ai_project_helper: true,
      code_review_dashboard: true,
      project_management: 'Complete tools (max 5 projects)',
      max_projects: 5,
      issue_tracking: true,
      concept_workspace: true,
      task_organization: true
    }
  },
  {
    name: 'Developers',
    ctaLink: '#',
    ctaText: 'Get started',
    features: {
      productivity: 'Enhanced productivity features',
      ai_assistant: 'Full Support',
      integrated_calendar: true,
      collaboration: 'Multi-user workspace',
      max_users: 50,
      development_tools: 'Advanced development assistance',
      code_linking: true,
      ai_project_helper: true,
      code_review_dashboard: true,
      project_management: 'Complete project organization tools',
      max_projects: 10,
      issue_tracking: true,
      concept_workspace: true,
      task_organization: true
    }
  },
  {
    name: 'Enterprise',
    ctaLink: '#',
    ctaText: 'Contact sales',
    features: {
      productivity: 'Enterprise-grade productivity suite',
      ai_assistant: 'Full Support',
      integrated_calendar: true,
      collaboration: 'Unlimited multi-user workspace',
      max_users: 'Unlimited',
      development_tools: 'Full development ecosystem',
      code_linking: true,
      max_projects: 'Unlimited',
      ai_project_helper: true,
      code_review_dashboard: true,
      project_management: 'Advanced analytics + unlimited projects',
      unlimited_projects: true,
      issue_tracking: true,
      concept_workspace: true,
      task_organization: true,
      cost_optimization: 'Optimized AI token pricing',
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

// Main Component
const PricingTable: React.FC<PricingTableProps> = ({ tiers = defaultTiers, className = '' }) => {
  const safeTiers = useMemo(() => tiers || defaultTiers, [tiers]);

  const isDevelopersTier = useMemo(() => 
    (tierName: string) => tierName === 'Developers',
    []
  );

  // Memoized header section
  const headerSection = useMemo(() => (
    <div className="grid grid-cols-4 border border-[#222225]">
      <div></div>
      {safeTiers.map((tier) => (
        <div
          key={tier.name}
          className={`p-5 border ${
            isDevelopersTier(tier.name) ? 'border-purple-600' : 'border-[#222225]'
          }`}
        >
          <h4 className="text-xl font-semibold m-0 mb-2">{tier.name}</h4>
          <CtaLink tier={tier} />
        </div>
      ))}
    </div>
  ), [safeTiers, isDevelopersTier]);

  // Memoized feature sections
  const featureSections = useMemo(() => 
    featureCategories.map((category) => (
      <div key={category.name} className="border border-[#222225]">
        <div className="grid grid-cols-4 bg-[#121212] p-4 font-medium">
          {category.name}
        </div>

        {category.features.map((feature) => (
          <div key={feature.key} className="grid grid-cols-4 border-t border-[#222225]">
            <div className="p-4 text-sm opacity-90 flex items-center">
              {feature.label}
            </div>
            {safeTiers.map((tier) => (
              <div
                key={`${tier.name}-${feature.key}`}
                className={`p-4 flex items-center justify-center border-l border-[#222225]`}
              >
                <FeatureValue value={tier.features[feature.key]} />
              </div>
            ))}
          </div>
        ))}
      </div>
    )),
    [safeTiers]
  );

  return (
    <div className={`w-full text-white font-sans ${className}`}>
      {headerSection}
      {featureSections}
    </div>
  );
};

export default memo(PricingTable);