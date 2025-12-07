import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover', // Ensure this matches your version
  typescript: true,
});

// Map your Stripe Product IDs
export const STRIPE_PRODUCTS = {
  TOKENS: {
    'gemini-2.5-flash': {
      standard: 'prod_TYZqW1aGYIANHn',
      enterprise: 'prod_TYZqW1aGYIANHn', // Fallback if no specific Ent product
    },
    'gemini-2.5-pro': {
      standard: 'prod_TYZs5FlS0Z2MH8',
      enterprise: 'prod_TYZxYNpduVmJwH', // Gemini 2.5 Pro Enterprise
    },
    'gemini-3-pro-preview': {
      standard: 'prod_TYZvCyk8Ol3xED',
      enterprise: 'prod_TYZy6F1JiT9P5I', // Gemini 3 Pro Enterprise
    },
  }
};

export const SUBSCRIPTION_PRICES = {
  INDIVIDUAL: 'price_1SbSNUCApZQlVD3lD47n3Vyn',
  DEVELOPERS: 'price_1SbSOBCApZQlVD3l4t3YD8Zu',
  ENTERPRISE: 'price_1SbSPJCApZQlVD3lbyIRHXqT',
};

export const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  return 'http://localhost:3000';
};