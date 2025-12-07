import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export async function checkProjectAccess(projectId: string) {
  const supabase = createClient(cookies());

  // 1. Get Project Owner
  const { data: project } = await supabase
    .from('projects')
    .select('created_by, users:created_by ( subscription_status, current_period_end )')
    .eq('id', projectId)
    .single();

  if (!project) return; // Or 404

  // 2. Check Subscription Status
  const ownerData = project.users as any; // Type assertion needed depending on your generated types
  const status = ownerData?.subscription_status;
  const expiryDate = ownerData?.current_period_end ? new Date(ownerData.current_period_end) : null;
  
  // Valid statuses
  const validStatuses = ['active', 'trialing'];
  
  if (!validStatuses.includes(status)) {
    // 3. Check Grace Period (15 Days)
    if (expiryDate) {
      const gracePeriodEnd = new Date(expiryDate);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 15);
      
      const now = new Date();

      if (now > gracePeriodEnd) {
        // Technically this is where you'd trigger a delete job or just hard block
        console.log("Project is in deletion zone");
      }
    }

    // Redirect to lock screen
    redirect('/dashboard/missing-subscription');
  }
}