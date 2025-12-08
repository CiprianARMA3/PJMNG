// frontend/app/dashboard/projects/[id]/management/ai/actions.ts
'use server'

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

/**
 * Defines the structure for a Token Transaction record.
 * This directly maps to the user-provided 'token_transactions' SQL schema.
 */
export interface TokenTransaction {
    id: number;
    created_at: string;
    user_id: string;
    project_id: string;
    model_key: string;
    tokens_added: number;
    amount_paid: number;
    currency: string;
    source: string;
    stripe_session_id: string | null;
    metadata: any;
}

/**
 * Fetches the purchase and usage history of AI tokens for a specific project.
 * RLS policies ensure the user has access to this project's data.
 */
export async function fetchTokenTransactions(projectId: string): Promise<{ data: TokenTransaction[] | null, error: string | null }> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("token_transactions")
    .select(`
      id,
      created_at,
      model_key,
      tokens_added,
      amount_paid,
      currency,
      source,
      metadata
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch token transactions:", error.message);
    return { data: null, error: error.message };
  }

  // NOTE: The 'user_id' is filtered by RLS and is not strictly needed for display, 
  // but could be joined with 'users' table if user names were required.
  return { data: data as TokenTransaction[], error: null };
}