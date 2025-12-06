// hooks/useProjectPermissions.ts
"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ProjectPermission, hasPermission } from '@/utils/permissions'; // Import from step 1

type RoleInfo = {
  role: string;
  permissions: string[];
};

export function useProjectPermissions(projectId: string) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPermissions() {
      if (!projectId) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch just the role_info column for the current user and project
        const { data, error } = await supabase
          .from('project_users')
          .select('role_info')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .single();

        if (error || !data) {
          console.error("Error fetching permissions:", error);
          setPermissions([]);
          return;
        }

        // Parse JSONB
        // The column might be a string or an object depending on Supabase client setup
        let roleInfo: RoleInfo | null = null;
        
        if (typeof data.role_info === 'string') {
            try {
                roleInfo = JSON.parse(data.role_info);
            } catch (e) {
                // If it's a simple string role (legacy support)
                roleInfo = { role: data.role_info, permissions: ['view'] }; 
            }
        } else {
            roleInfo = data.role_info;
        }

        if (roleInfo && Array.isArray(roleInfo.permissions)) {
          setPermissions(roleInfo.permissions);
          setRole(roleInfo.role);
        } else {
            // Fallback if structure is invalid
            setPermissions(['view']);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPermissions();
  }, [projectId]);

  // The check function to use in UI
  const checkAccess = (requiredPerm: ProjectPermission) => {
    if (loading) return false; // Fail safe while loading
    return hasPermission(permissions, requiredPerm);
  };

  return { permissions, role, loading, checkAccess };
}