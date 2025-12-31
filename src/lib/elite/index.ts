/**
 * ELITE Workspace Library
 * 
 * Main exports for the ELITE leadership training workspace.
 */

// Kernel (Context, Policy, Audit, Events)
export * from "./kernel";

// Permissions
export {
  ELITE_ROLES,
  ELITE_PERMISSIONS,
  ELITE_ROLE_PERMISSIONS,
  type EliteRole,
  type ElitePermission,
  isValidEliteRole,
  hasElitePermission,
  getElitePermissions,
} from "./permissions";

// Services
export { curriculumService } from "./services/curriculum";
export { completionService } from "./services/completion";
export { enrollmentService } from "./services/enrollment";
export { quizService } from "./services/quiz";
export { discussionService } from "./services/discussion";
export { submissionService } from "./services/submission";
export { cohortService } from "./services/cohort";
export { sessionService } from "./services/session";

