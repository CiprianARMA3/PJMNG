'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export const usePasswordRecoveryRedirect = () => {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkRecovery = async () => {
      // 1. Check if the URL contains "type=recovery" (Common in Supabase redirects)
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);
      
      if (hash.includes('type=recovery') || searchParams.get('type') === 'recovery') {
        router.push("/auth/update-password");
        return;
      }

      // 2. Check the session metadata directly
      const { data: { session } } = await supabase.auth.getSession();
      
      // If we have a session, check if it was created via a recovery link
      if (session) {
        // Supabase sets the 'amr' (Authentication Method Reference) to 'recovery' 
        // when a user clicks a reset link.
        const isRecovery = session.user?.app_metadata?.provider === 'email' && 
                           session.user?.recovery_sent_at;

        if (isRecovery) {
          router.push("/auth/update-password");
        }
      }
    };

    // Run immediately on mount
    checkRecovery();

    // Also keep the listener as a backup
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        router.push("/auth/update-password");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);
};