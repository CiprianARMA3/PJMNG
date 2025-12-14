'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useProjectPermissions } from '@/hooks/useProjectPermissions';
import { PAGE_REQUIREMENTS } from '@/utils/permissions';

export default function ProjectAuthGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const params = useParams();

    // Specific check to ensure projectId is a string and never undefined
    const rawId = params?.id;
    const projectId = Array.isArray(rawId) ? rawId[0] : (rawId || '');

    // If we somehow don't have an ID yet, we pass an empty string which the hook handles gracefully
    const { checkAccess, loading } = useProjectPermissions(projectId);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // 1. Wait for permissions to load
        if (loading || !projectId) return;

        // 2. Calculate the relative path (suffix)
        const projectBase = `/dashboard/projects/${projectId}`;
        let relativePath = pathname.replace(projectBase, '');
        
        // Handle root path or trailing slashes if necessary
        if (relativePath === '') relativePath = '/';

        // 3. Check if this path has a restriction in your permissions.ts
        const requiredPermission = PAGE_REQUIREMENTS[relativePath];

        // 4. Enforce the rule
        if (requiredPermission) {
            if (checkAccess(requiredPermission)) {
                setIsAuthorized(true);
            } else {
                console.warn(`Access denied. Required: ${requiredPermission}`);
                // FIX: Redirect to the specific project overview instead of main dashboard
                router.push(`/dashboard/projects/${projectId}`); 
            }
        } else {
            // No specific restriction defined for this page -> Allow access
            setIsAuthorized(true);
        }

    }, [pathname, loading, checkAccess, projectId, router]);

    // 5. Block rendering until authorized
    if (loading || !isAuthorized) {
        return (
            <div role="status" className="flex justify-center items-center h-screen bg-[#0a0a0a]">
                <svg aria-hidden="true" className="inline w-8 h-8 text-neutral-400 animate-spin fill-white" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                </svg>
                <span className="sr-only">Loading...</span>
            </div>
        );
    }

    // 6. Render the page content once safe
    return <>{children}</>;
}