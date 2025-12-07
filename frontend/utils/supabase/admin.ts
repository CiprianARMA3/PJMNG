import { createClient } from '@supabase/supabase-js';

// Note: This client bypasses Row Level Security (RLS). 
// Use it ONLY in server-side secure contexts (like webhooks).
export const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};