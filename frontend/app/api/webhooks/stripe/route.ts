import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe/config';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(req: Request) {
  const body = await req.text();
  const headerList = await headers();
  const signature = headerList.get('Stripe-Signature') as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const metadata = session.metadata;

    console.log(`✅ Payment received: ${session.id}`);

    if (metadata?.type === 'token_refill') {
      try {
        const projectId = metadata.projectId;
        const newTokens = JSON.parse(metadata.purchased_tokens || '{}');
        const amountPaid = session.amount_total / 100;

        // 1. Check if a pack already exists for this project
        const { data: existingPack, error: fetchError } = await supabaseAdmin
            .from('token_packs')
            .select('*')
            .eq('project_id', projectId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            // Real error (not just "not found")
            console.error("Error checking existing packs:", fetchError);
            return new NextResponse('Database Error', { status: 500 });
        }

        if (existingPack) {
            // --- SCENARIO A: UPDATE EXISTING (SUMMING) ---
            console.log("🔄 Updating existing token balance...");

            const oldPurchased = existingPack.tokens_purchased || {};
            const oldRemaining = existingPack.remaining_tokens || {};

            // Helper to safe sum
            const sumTokens = (key: string, oldObj: any, newObj: any) => {
                return (Number(oldObj[key]) || 0) + (Number(newObj[key]) || 0);
            };

            const updatedPurchased = {
                "gemini-2.5-pro": sumTokens("gemini-2.5-pro", oldPurchased, newTokens),
                "gemini-2.5-flash": sumTokens("gemini-2.5-flash", oldPurchased, newTokens),
                "gemini-3-pro-preview": sumTokens("gemini-3-pro-preview", oldPurchased, newTokens)
            };

            const updatedRemaining = {
                "gemini-2.5-pro": sumTokens("gemini-2.5-pro", oldRemaining, newTokens),
                "gemini-2.5-flash": sumTokens("gemini-2.5-flash", oldRemaining, newTokens),
                "gemini-3-pro-preview": sumTokens("gemini-3-pro-preview", oldRemaining, newTokens)
            };

            // Update the row
            const { error: updateError } = await supabaseAdmin
                .from('token_packs')
                .update({
                    tokens_purchased: updatedPurchased,
                    remaining_tokens: updatedRemaining,
                    price_paid: Number(existingPack.price_paid) + amountPaid, // Summing total spend
                    updated_at: new Date().toISOString(),
                    // Extend expiry if needed, or keep original. Let's extend it to 1 year from now.
                    expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
                })
                .eq('id', existingPack.id);

            if (updateError) throw updateError;
            console.log("✅ Tokens summed and updated!");

        } else {
            // --- SCENARIO B: INSERT NEW (FIRST PURCHASE) ---
            console.log("✨ Creating new token wallet...");

            // Ensure keys exist
            const fullTokenSet = {
                "gemini-2.5-pro": newTokens["gemini-2.5-pro"] || 0,
                "gemini-2.5-flash": newTokens["gemini-2.5-flash"] || 0,
                "gemini-3-pro-preview": newTokens["gemini-3-pro-preview"] || 0
            };

            const { error: insertError } = await supabaseAdmin.from('token_packs').insert({
                user_id: metadata.userId,
                project_id: projectId,
                price_paid: amountPaid,
                purchased_at: new Date().toISOString(),
                expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
                tokens_purchased: fullTokenSet,
                remaining_tokens: fullTokenSet, // Initially same as purchased
                metadata: {
                    stripe_session_id: session.id,
                    payment_status: session.payment_status
                }
            });

            if (insertError) throw insertError;
            console.log("✅ New wallet created!");
        }
        
      } catch (err) {
        console.error('❌ Error processing token refill:', err);
        return new NextResponse('Processing Error', { status: 500 });
      }
    } 
  }

  return new NextResponse(null, { status: 200 });
}