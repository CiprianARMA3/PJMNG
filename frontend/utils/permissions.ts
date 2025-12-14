// utils/permissions.ts

export type ProjectPermission = 
    | "dashboard"
    | "tasks"
    | "board"
    | "events-workflow"
    | "activity-overview"
    | "repository-logs"
    | "ai-assistant"
    | "ai-repo-review"
    | "ai-sql-helper"
    | "ai-roadmap-visualizer"
    | "project-settings"
    | "collaborators"
    | "ai-monitor"
    | "manager-project-settings"
    | "manager-workflow-events"
    | "management"
    | "manage-team"
    | "manage-ai-assistant"
    | "all"; // Admin override

// Map the URL suffix (what comes after /dashboard/projects/[id]) to the required permission ID
export const PAGE_REQUIREMENTS: Record<string, ProjectPermission> = {
    // Overview
    // Development
    '/development/tasks': 'tasks',
    '/development/board': 'board',
    '/development/events-workflow': 'events-workflow',
    '/development/calendar': 'activity-overview', // Maps "Activity Overview" to calendar page
    '/development/repository-logs': 'repository-logs',

    // AI Tools
    '/ai/ai-assistant': 'ai-assistant',
    '/ai/code-review': 'ai-repo-review', // Maps "Repo Review" route
    '/ai/sql-helper': 'ai-sql-helper',
    '/ai/roadmap-visualizer': 'ai-roadmap-visualizer',

    // Settings
    '/settings/collaborators': 'collaborators',
    '/settings/ai-info': 'ai-monitor',

    // Manager Settings
    '/management/project-settings': 'manager-project-settings',
    '/management/workflow-events': 'manager-workflow-events',
    '/management/team': 'manage-team',
    '/management/ai': 'manage-ai-assistant',
};

// Helper to check if a user has permission
export const hasPermission = (
  userPermissions: string[], 
  requiredPermission: ProjectPermission
): boolean => {
  if (!userPermissions) return false;
  if (userPermissions.includes('all')) return true;
  return userPermissions.includes(requiredPermission);
};