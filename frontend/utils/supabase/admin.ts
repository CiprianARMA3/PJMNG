import { createClient } from '@supabase/supabase-js'

// NEVER use this on the client in production!
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)