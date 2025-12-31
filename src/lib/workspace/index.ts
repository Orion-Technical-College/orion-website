/**
 * Workspace System
 * 
 * Exports for workspace profile resolution and composition.
 */

// Types and contracts
export type {
  WorkspaceKey,
  WorkspaceModule,
  WorkspaceDisplay,
  WorkspaceResolutionResult,
} from "./types";

export {
  WORKSPACE_KEYS,
  WORKSPACE_ROUTES,
  isValidWorkspaceKey,
  parseWorkspaceKey,
  routeToWorkspaceKey,
} from "./types";

// Resolver
export type { ResolvedWorkspaceProfile } from "./resolver";

export {
  resolveWorkspaceProfile,
  hasWorkspaceAccess,
  getDefaultEliteProfileModules,
} from "./resolver";

