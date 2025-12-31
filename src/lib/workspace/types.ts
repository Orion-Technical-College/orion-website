/**
 * Workspace Types and Contracts
 * 
 * This module defines the core types for workspace resolution and composition.
 * WorkspaceKey is the stable identifier for a workspace product/intent.
 */

/**
 * Workspace Keys - the stable identifiers for workspace products
 * 
 * - DEFAULT: The default recruiter/EMC workspace
 * - EMC: Explicit EMC workspace (alias for default)
 * - OTC: Orion Technical College workspace (tenant-specific route)
 * - ELITE: ELITE Leadership Training workspace
 */
export const WORKSPACE_KEYS = {
  DEFAULT: "DEFAULT",
  EMC: "EMC",
  OTC: "OTC",
  ELITE: "ELITE",
} as const;

export type WorkspaceKey = (typeof WORKSPACE_KEYS)[keyof typeof WORKSPACE_KEYS];

/**
 * Validate a string is a valid WorkspaceKey
 */
export function isValidWorkspaceKey(key: string): key is WorkspaceKey {
  return Object.values(WORKSPACE_KEYS).includes(key as WorkspaceKey);
}

/**
 * Parse and validate a workspace key, with fallback to DEFAULT
 */
export function parseWorkspaceKey(key: string | undefined): WorkspaceKey {
  if (key && isValidWorkspaceKey(key)) {
    return key;
  }
  return WORKSPACE_KEYS.DEFAULT;
}

/**
 * Module definition for workspace composition
 */
export interface WorkspaceModule {
  moduleKey: string;
  layoutSlot: "sidebar" | "main" | "header" | "footer";
  navItem?: {
    label: string;
    icon: string;
    href: string;
    order: number;
  };
  // Reference to props that should be passed to the module
  propsRef?: string;
}

/**
 * Display metadata for a workspace
 */
export interface WorkspaceDisplay {
  name: string;
  description: string;
  icon: string;
  color: string;
}

/**
 * The resolver contract - what WorkspaceShell receives after resolution
 * This is the "composition ABI" that protects from refactors
 */
export interface WorkspaceResolutionResult {
  // Identity
  workspaceKey: WorkspaceKey;
  profileId: string | null;
  profileVersion: number | null;
  
  // Context
  tenantId: string;
  tenantName: string;
  userId: string;
  userRole: string;
  orgUnitIds: string[];
  
  // Composition
  modules: WorkspaceModule[];
  featureFlags: Record<string, boolean>;
  
  // Display
  display: WorkspaceDisplay;
  
  // Permissions
  permissions: string[];
}

/**
 * Map workspace keys to their route paths
 */
export const WORKSPACE_ROUTES: Record<WorkspaceKey, string> = {
  [WORKSPACE_KEYS.DEFAULT]: "/",
  [WORKSPACE_KEYS.EMC]: "/emc",
  [WORKSPACE_KEYS.OTC]: "/otc",
  [WORKSPACE_KEYS.ELITE]: "/elite",
};

/**
 * Map route paths back to workspace keys
 */
export function routeToWorkspaceKey(pathname: string): WorkspaceKey {
  switch (pathname) {
    case "/otc":
      return WORKSPACE_KEYS.OTC;
    case "/emc":
      return WORKSPACE_KEYS.EMC;
    case "/elite":
      return WORKSPACE_KEYS.ELITE;
    case "/":
    default:
      return WORKSPACE_KEYS.DEFAULT;
  }
}

