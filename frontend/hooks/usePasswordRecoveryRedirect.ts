// frontend/hooks/usePasswordRecoveryRedirect.ts
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export const usePasswordRecoveryRedirect = () => {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // Listen specifically for the Password Recovery event
      if (event === "PASSWORD_RECOVERY") {
        router.push("/auth/update-password");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);
};