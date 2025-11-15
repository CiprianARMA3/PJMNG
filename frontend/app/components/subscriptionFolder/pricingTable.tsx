import React from 'react';
import { ArrowRight, Check, X, HelpCircle } from 'lucide-react';

// Types
interface PricingTier {
  name: string;
  features: {
    [key: string]: string | boolean;
  };
  ctaLink: string;
  ctaText: string;
}

interface PricingTableProps {
  tiers?: PricingTier[];
  className?: string;
}

// Tooltip Component
const Tooltip = ({ content }: { content: string }) => (
  <div className="relative flex group">
    <HelpCircle className="w-5 h-5 text-gray-400 cursor-help" />
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-[#1a1a1a] rounded-lg text-white text-sm w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
      <p className="m-0">{content}</p>
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[#1a1a1a]"></div>
    </div>
  </div>
);

// Default sample data
const defaultTiers: PricingTier[] = [
  {
    name: 'Free',
    ctaLink: '  ',
    ctaText: 'Get started',
    features: {
      projects: '1 project',
      users: 'Up to 3',
      storage: '5 GB',
      teamAccess: false,
      sharedWorkspaces: false,
      guestAccounts: false,
      dataEncryption: true,
      twoFactorAuth: true,
      sso: false,
      helpCenter: true,
      prioritySupport: false,
      dedicatedManager: false,
      advancedCustomization: false,
      integrations: 'Limited',
      apiAccess: false,
      regularUpdates: true,
      betaAccess: false
    }
  },
  {
    name: 'Pro',
    ctaLink: '  ',
    ctaText: 'Get started',
    features: {
      projects: 'Unlimited',
      users: 'Up to 25',
      storage: '100 GB',
      teamAccess: true,
      sharedWorkspaces: true,
      guestAccounts: true,
      dataEncryption: true,
      twoFactorAuth: true,
      sso: false,
      helpCenter: true,
      prioritySupport: true,
      dedicatedManager: false,
      advancedCustomization: true,
      integrations: '20+ integrations',
      apiAccess: true,
      regularUpdates: true,
      betaAccess: false
    }
  },
  {
    name: 'Expert',
    ctaLink: '  ',
    ctaText: 'Get started',
    features: {
      projects: 'Unlimited',
      users: 'Unlimited',
      storage: '1 TB',
      teamAccess: true,
      sharedWorkspaces: true,
      guestAccounts: true,
      dataEncryption: true,
      twoFactorAuth: true,
      sso: true,
      helpCenter: true,
      prioritySupport: true,
      dedicatedManager: true,
      advancedCustomization: true,
      integrations: 'Unlimited',
      apiAccess: true,
      regularUpdates: true,
      betaAccess: true
    }
  }
];

// Feature categories structure
const featureCategories = [
  {
    name: 'General',
    features: [
      { key: 'projects', label: 'Projects' },
      { key: 'users', label: 'Users' },
      { key: 'storage', label: 'Storage' }
    ]
  },
  {
    name: 'Collaboration',
    features: [
      { key: 'teamAccess', label: 'Team access' },
      { key: 'sharedWorkspaces', label: 'Shared workspaces' },
      { key: 'guestAccounts', label: 'Guest accounts', hasTooltip: true }
    ]
  },
  {
    name: 'Security',
    features: [
      { key: 'dataEncryption', label: 'Data encryption' },
      { key: 'twoFactorAuth', label: 'Two-factor authentication' },
      { key: 'sso', label: 'Single sign-on (SSO)', hasTooltip: true }
    ]
  },
  {
    name: 'Support',
    features: [
      { key: 'helpCenter', label: 'Help center access' },
      { key: 'prioritySupport', label: 'Priority email support' },
      { key: 'dedicatedManager', label: 'Dedicated account manager' }
    ]
  },
  {
    name: 'Features',
    features: [
      { key: 'advancedCustomization', label: 'Advanced customization' },
      { key: 'integrations', label: 'Integrations' },
      { key: 'apiAccess', label: 'API access' }
    ]
  },
  {
    name: 'Updates',
    features: [
      { key: 'regularUpdates', label: 'Regular updates' },
      { key: 'betaAccess', label: 'Beta features access' }
    ]
  }
];

// Main Component
const PricingTable: React.FC<PricingTableProps> = ({ 
  tiers = defaultTiers, 
  className = '' 
}) => {
  // Safe guard against undefined tiers
  const safeTiers = tiers || defaultTiers;

  const renderFeatureValue = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <div className="flex items-center justify-center w-5 h-5">
          <Check className="w-5 h-5 text-[#83eefc]" />
        </div>
      ) : (
        <div className="flex items-center justify-center w-5 h-5">
          <X className="w-5 h-5 text-gray-400" />
        </div>
      );
    }

    return (
      <div className="text-center">
        <p className="text-white text-sm m-0">{value}</p>
      </div>
    );
  };

  return (
    <div className={`w-full     text-white font-sans ${className}`}>
      {/* Header Section */}
      <div className="backdrop-blur-sm    ">
        <div className="grid grid-cols-4 border border-[#222225]">
          {/* Empty spacer cell */}
          <div className="bg-transparent"></div>
          
          {/* Tier headers */}
          {safeTiers.map((tier, index) => (
            <div 
              key={tier.name} 
              className={`
                border border-[#222225] p-5 flex flex-col gap-4
                ${index === 0 ? 'rounded-tl-lg' : ''}
                ${index === safeTiers.length - 1 ? 'rounded-tr-lg' : ''}
              `}
            >
              <div>
                <h4 className="text-xl font-semibold m-0">{tier.name}</h4>
              </div>
              <div>
                <a 
                  href={tier.ctaLink} 
                  className="flex items-center gap-3 no-underline text-white opacity-80 hover:opacity-100 transition-opacity duration-200 group"
                >
                                      <div>
                    <p className="text-sm tracking-tight opacity-80 m-0">{tier.ctaText}</p>
                  </div>  
                  <div className="relative bg-[#121212] rounded-lg p-2 w-6 h-6">
                    <div className="absolute inset-0 flex items-center justify-center opacity-50 group-hover:opacity-0 transition-opacity">
                      <ArrowRight className="w-full h-full text-white" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-full h-full text-white" />
                    </div>
                  </div>
  
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Sections */}
      {featureCategories.map((category) => (
        <div key={category.name} className="border border-[#222225]">
          {/* Category Header */}
          <div className="grid grid-cols-4 bg-[#121212]">
            <div className="p-4">
              <p className="font-medium m-0">{category.name}</p>
            </div>
            {safeTiers.map((_, index) => (
              <div key={index} className="border-l border-[#222225]"></div>
            ))}
          </div>

          {/* Features List */}
          {category.features.map((feature) => (
            <div key={feature.key} className="grid grid-cols-4 border-b border-[#222225]">
              <div className="p-4     flex items-center">
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm opacity-90 m-0">{feature.label}</p>
                  {feature.hasTooltip && (
                    <Tooltip content={
                      feature.key === 'guestAccounts' 
                        ? 'Guest accounts allow external collaborators to view or comment without taking up a paid seat.'
                        : 'SSO enables users to log in securely using their organization\'s identity provider.'
                    } />
                  )}
                </div>
              </div>
              
              {safeTiers.map((tier) => (
                <div 
                  key={`${feature.key}-${tier.name}`} 
                  className="border-l border-[#222225]     flex items-center justify-center p-4"
                >
                  {renderFeatureValue(tier.features[feature.key])}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default PricingTable;