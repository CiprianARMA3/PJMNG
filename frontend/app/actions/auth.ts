// frontend/app/actions/auth.ts

'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers'; // Needed for createClient in server context

/**
 * Signs the currently authenticated user out of Supabase and redirects to the login page.
 */
export async function signOut() {
  const supabase = createClient(cookies());

  // 1. Terminate the user's session
  await supabase.auth.signOut();
  
  // 2. Redirect to the login page (or your desired unauthenticated route)
  return redirect('/auth/login'); 
}