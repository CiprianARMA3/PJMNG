import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe/config';
import { createAdminClient } from '@/utils/supabase/admin'; // Import Admin Client

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature') as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // FIX: Use Admin Client to bypass RLS policies
  const supabaseAdmin = createAdminClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const metadata = session.metadata;

    if (metadata.type === 'token_refill') {
      try {
        const purchasedTokensMap = JSON.parse(metadata.purchased_tokens);

        // Ensure all keys exist with default 0 if not purchased
        // This prevents "null" or missing keys in your JSONB column
        const fullTokenSet = {
          "gemini-2.5-pro": purchasedTokensMap["gemini-2.5-pro"] || 0,
          "gemini-2.5-flash": purchasedTokensMap["gemini-2.5-flash"] || 0,
          "gemini-3-pro-preview": purchasedTokensMap["gemini-3-pro-preview"] || 0
        };

        // Insert new pack
        const { error } = await supabaseAdmin.from('token_packs').insert({
          user_id: metadata.userId,
          project_id: metadata.projectId,
          price_paid: session.amount_total / 100,
          purchased_at: new Date().toISOString(),
          // Set expiry to 1 year from now (example policy)
          expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
          tokens_purchased: fullTokenSet,
          remaining_tokens: fullTokenSet, // Initially full
          metadata: {
            stripe_session_id: session.id,
            payment_status: session.payment_status
          }
        });

        if (error) {
            console.error('Supabase Insert Error:', error);
            return new NextResponse('Database Error', { status: 500 });
        }
        
      } catch (err) {
        console.error('Error processing token refill:', err);
        return new NextResponse('Processing Error', { status: 500 });
      }
    } 
  }

  return new NextResponse(null, { status: 200 });
}