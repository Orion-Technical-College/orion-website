/**
 * ELITE Module Definitions
 * 
 * Defines all modules for the ELITE workspace.
 * These are registered with the module registry on app initialization.
 */

import { defineModule, type ModuleDefinition } from "../modules";
import { ELITE_PERMISSIONS } from "./permissions";

/**
 * ELITE Dashboard Module
 */
export const eliteDashboardModule = defineModule({
  moduleKey: "elite.dashboard",
  moduleApiVersion: 1,
  layoutSlot: "main",
  navigation: {
    path: "/elite",
    label: "Dashboard",
    icon: "LayoutDashboard",
    order: 0,
  },
  routes: ["/elite"],
  requiredPermissions: [ELITE_PERMISSIONS.ACCESS_ELITE_WORKSPACE],
  capabilities: ["dashboard.view"],
  component: () => import("@/components/elite/dashboard/elite-dashboard"),
});

/**
 * Cohorts Module
 */
export const eliteCohortsModule = defineModule({
  moduleKey: "elite.cohorts",
  moduleApiVersion: 1,
  layoutSlot: "main",
  navigation: {
    path: "/elite/cohorts",
    label: "Cohorts",
    icon: "Users",
    order: 10,
  },
  routes: ["/elite/cohorts", "/elite/cohorts/[id]"],
  requiredPermissions: [ELITE_PERMISSIONS.VIEW_COHORTS],
  capabilities: ["cohort.read", "cohort.write", "roster.manage"],
  component: () => import("@/components/elite/cohorts/cohort-list"),
});

/**
 * Sessions Module
 */
export const eliteSessionsModule = defineModule({
  moduleKey: "elite.sessions",
  moduleApiVersion: 1,
  layoutSlot: "main",
  navigation: {
    path: "/elite/sessions",
    label: "Sessions",
    icon: "Calendar",
    order: 20,
  },
  routes: ["/elite/sessions", "/elite/sessions/[id]"],
  requiredPermissions: [ELITE_PERMISSIONS.VIEW_SESSIONS],
  capabilities: ["session.read", "session.write", "attendance.record"],
  component: () => import("@/components/elite/sessions/session-list"),
});

/**
 * Coaching Module
 */
export const eliteCoachingModule = defineModule({
  moduleKey: "elite.coaching",
  moduleApiVersion: 1,
  layoutSlot: "main",
  navigation: {
    path: "/elite/coaching",
    label: "Coaching",
    icon: "MessageSquare",
    order: 30,
  },
  routes: ["/elite/coaching", "/elite/coaching/[learnerId]"],
  requiredPermissions: [ELITE_PERMISSIONS.VIEW_COACHING],
  capabilities: ["coaching.read", "coaching.write"],
  component: () => import("@/components/elite/coaching/coaching-workspace"),
});

/**
 * Learner Profiles Module
 */
export const eliteLearnerProfilesModule = defineModule({
  moduleKey: "elite.learnerProfiles",
  moduleApiVersion: 1,
  layoutSlot: "main",
  navigation: {
    path: "/elite/learners",
    label: "Learners",
    icon: "GraduationCap",
    order: 35,
  },
  routes: ["/elite/learners", "/elite/learners/[id]"],
  requiredPermissions: [ELITE_PERMISSIONS.VIEW_COHORTS],
  capabilities: ["learner.view"],
  component: () => import("@/components/elite/learners/learner-list"),
});

/**
 * Assignments Module
 */
export const eliteAssignmentsModule = defineModule({
  moduleKey: "elite.assignments",
  moduleApiVersion: 1,
  layoutSlot: "main",
  navigation: {
    path: "/elite/assignments",
    label: "Assignments",
    icon: "ClipboardList",
    order: 40,
  },
  routes: ["/elite/assignments", "/elite/assignments/[id]"],
  requiredPermissions: [ELITE_PERMISSIONS.VIEW_COHORTS],
  capabilities: ["assignment.read", "assignment.write", "submission.grade"],
  component: () => import("@/components/elite/assignments/assignment-list"),
});

/**
 * Artifacts Module
 */
export const eliteArtifactsModule = defineModule({
  moduleKey: "elite.artifacts",
  moduleApiVersion: 1,
  layoutSlot: "main",
  navigation: {
    path: "/elite/artifacts",
    label: "Artifacts",
    icon: "FileBox",
    order: 50,
  },
  routes: ["/elite/artifacts", "/elite/artifacts/[id]"],
  requiredPermissions: [ELITE_PERMISSIONS.VIEW_ARTIFACTS],
  capabilities: ["artifact.read", "artifact.write"],
  component: () => import("@/components/elite/artifacts/artifact-library"),
});

/**
 * Messaging Module (right panel)
 */
export const eliteMessagingModule = defineModule({
  moduleKey: "elite.messaging",
  moduleApiVersion: 1,
  layoutSlot: "right_panel",
  routes: ["/elite/messages"],
  requiredPermissions: [ELITE_PERMISSIONS.SEND_MESSAGES],
  capabilities: ["message.send", "announcement.send"],
  component: () => import("@/components/elite/messaging/messaging-panel"),
});

/**
 * Tasks Module (right panel)
 */
export const eliteTasksModule = defineModule({
  moduleKey: "elite.tasks",
  moduleApiVersion: 1,
  layoutSlot: "right_panel",
  routes: ["/elite/tasks"],
  requiredPermissions: [ELITE_PERMISSIONS.VIEW_TASKS],
  capabilities: ["task.read", "task.write"],
  component: () => import("@/components/elite/tasks/task-panel"),
});

/**
 * Analytics Module
 */
export const eliteAnalyticsModule = defineModule({
  moduleKey: "elite.analytics",
  moduleApiVersion: 1,
  layoutSlot: "main",
  navigation: {
    path: "/elite/analytics",
    label: "Analytics",
    icon: "BarChart3",
    order: 60,
  },
  routes: ["/elite/analytics"],
  requiredPermissions: [ELITE_PERMISSIONS.VIEW_COHORT_ANALYTICS],
  requiredFeatureFlags: ["ELITE_ANALYTICS_ENABLED"],
  capabilities: ["analytics.view", "analytics.export"],
  component: () => import("@/components/elite/analytics/analytics-dashboard"),
});

/**
 * Admin Module
 */
export const eliteAdminModule = defineModule({
  moduleKey: "elite.admin",
  moduleApiVersion: 1,
  layoutSlot: "main",
  navigation: {
    path: "/elite/admin",
    label: "Admin",
    icon: "Settings",
    order: 100,
  },
  routes: ["/elite/admin", "/elite/admin/profiles", "/elite/admin/templates"],
  requiredPermissions: [ELITE_PERMISSIONS.MANAGE_ELITE_CONFIG],
  capabilities: ["admin.config", "admin.profiles"],
  component: () => import("@/components/elite/admin/admin-console"),
});

/**
 * All ELITE modules
 */
export const ELITE_MODULES: ModuleDefinition[] = [
  eliteDashboardModule,
  eliteCohortsModule,
  eliteSessionsModule,
  eliteCoachingModule,
  eliteLearnerProfilesModule,
  eliteAssignmentsModule,
  eliteArtifactsModule,
  eliteMessagingModule,
  eliteTasksModule,
  eliteAnalyticsModule,
  eliteAdminModule,
];

/**
 * Register all ELITE modules with the registry
 */
export function registerEliteModules(): void {
  const { moduleRegistry } = require("../modules");
  
  for (const eliteModule of ELITE_MODULES) {
    if (!moduleRegistry.has(eliteModule.moduleKey)) {
      moduleRegistry.register(eliteModule);
    }
  }
}

