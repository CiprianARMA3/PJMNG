import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover', // Updated to latest stable or use '2025-11-17.clover' if you have early access
  typescript: true,
});