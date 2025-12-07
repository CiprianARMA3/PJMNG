// frontend/utils/stripe/config.ts

// ✅ EXACT UUIDS FROM YOUR DATABASE
export const PLAN_UUIDS = {
  INDIVIDUAL: 'a2c06716-8900-4ddf-ac1c-878ec72136c5',
  DEVELOPERS: '43e952ee-ce17-4258-93ed-466386231e20',
  ENTERPRISE: '186774c3-cdb5-441b-8f3b-69b2af59eeef',
};

// ⚠️ REPLACE THESE WITH YOUR ACTUAL STRIPE PRICE IDs (starts with price_...)
export const SUBSCRIPTION_PLANS = {
  [PLAN_UUIDS.INDIVIDUAL]: {
    name: 'Individual',
    prices: {
      month: 'price_1SbSNUCApZQlVD3lD47n3Vyn', // Replace with REAL Stripe Price ID
      year: 'price_1SbSPxCApZQlVD3lzw5PeubP'   // Replace with REAL Stripe Price ID
    },
    limits: { projects: 5 }
  },
  [PLAN_UUIDS.DEVELOPERS]: {
    name: 'Developers',
    prices: {
      month: 'price_1SbSOBCApZQlVD3l4t3YD8Zu', // Replace with REAL Stripe Price ID
      year: 'price_1SbSRBCApZQlVD3lOYFeJiXj'   // Replace with REAL Stripe Price ID
    },
    limits: { projects: 10 }
  },
  [PLAN_UUIDS.ENTERPRISE]: {
    name: 'Enterprise',
    prices: {
      month: 'price_1SbSPJCApZQlVD3lbyIRHXqT', // Replace with REAL Stripe Price ID
      year: 'price_1SbSRWCApZQlVD3lVygxedWv'   // Replace with REAL Stripe Price ID
    },
    limits: { projects: 9999 }
  }
};

export const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  return 'http://localhost:3000';
};

// Only for client-side usage (tokens)
export const STRIPE_PRODUCTS = {
  TOKENS: {
    'gemini-2.5-flash': { standard: 'prod_TYZqW1aGYIANHn', enterprise: 'prod_TYZqW1aGYIANHn' },
    'gemini-2.5-pro': { standard: 'prod_TYZs5FlS0Z2MH8', enterprise: 'prod_TYZxYNpduVmJwH' },
    'gemini-3-pro-preview': { standard: 'prod_TYZvCyk8Ol3xED', enterprise: 'prod_TYZy6F1JiT9P5I' },
  }
};