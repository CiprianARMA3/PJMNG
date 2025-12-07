// ✅ SAFE FOR CLIENT: Constants only.

export const STRIPE_PRODUCTS = {
  TOKENS: {
    'gemini-2.5-flash': {
      standard: 'prod_TYZqW1aGYIANHn',
      enterprise: 'prod_TYZqW1aGYIANHn',
    },
    'gemini-2.5-pro': {
      standard: 'prod_TYZs5FlS0Z2MH8',
      enterprise: 'prod_TYZxYNpduVmJwH',
    },
    'gemini-3-pro-preview': {
      standard: 'prod_TYZvCyk8Ol3xED',
      enterprise: 'prod_TYZy6F1JiT9P5I',
    },
  }
};

export const SUBSCRIPTION_PRICES = {
  INDIVIDUAL: 'price_1SbSNUCApZQlVD3lD47n3Vyn',
  DEVELOPERS: 'price_1SbSOBCApZQlVD3l4t3YD8Zu',
  ENTERPRISE: 'price_1SbSPJCApZQlVD3lbyIRHXqT',
};

export const PLAN_UUIDS = {
  INDIVIDUAL: 'a2c06716-8900-4ddf-ac1c-878ec72136c5',
  DEVELOPERS: '43e952ee-ce17-4258-93ed-466386231e20',
  ENTERPRISE: '186774c3-cdb5-441b-8f3b-69b2af59eeef',
};

export const SUBSCRIPTION_PLANS = {
  [PLAN_UUIDS.INDIVIDUAL]: {
    name: 'Individual',
    prices: {
      month: 'price_1SbSNUCApZQlVD3lD47n3Vyn',
      year: 'price_1SbSPxCApZQlVD3lzw5PeubP'
    },
    limits: { projects: 5 }
  },
  [PLAN_UUIDS.DEVELOPERS]: {
    name: 'Developers',
    prices: {
      month: 'price_1SbSOBCApZQlVD3l4t3YD8Zu',
      year: 'price_1SbSRBCApZQlVD3lOYFeJiXj'
    },
    limits: { projects: 10 }
  },
  [PLAN_UUIDS.ENTERPRISE]: {
    name: 'Enterprise',
    prices: {
      month: 'price_1SbSPJCApZQlVD3lbyIRHXqT',
      year: 'price_1SbSRWCApZQlVD3lVygxedWv'
    },
    limits: { projects: 9999 }
  }
};

export const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  return 'http://localhost:3000';
};