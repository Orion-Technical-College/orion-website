/**
 * ELITE Kernel Types
 * Core types used across the ELITE service kernel
 */

import type { EliteRole, ElitePermission } from "../permissions";

/**
 * Resolved context for an ELITE user
 * This is the single source of truth for authorization decisions
 */
export interface EliteContext {
  /** Tenant ID (clientId in the database) */
  tenantId: string;
  
  /** Tenant name for display */
  tenantName: string;
  
  /** User ID */
  userId: string;
  
  /** User's primary org unit ID (from isPrimary=true membership) */
  orgUnitId: string | null;
  
  /** All org unit IDs the user is a member of */
  orgUnitIds: string[];
  
  /** User's effective ELITE role (highest privilege from memberships) */
  eliteRole: EliteRole;
  
  /** All permissions derived from the role */
  effectivePermissions: ElitePermission[];
  
  /** Cohort IDs the user has access to */
  cohortIds: string[];
  
  /** Feature flags for the tenant */
  featureFlags: Record<string, boolean>;
}

/**
 * ELITE event for the event store
 */
export interface EliteEvent {
  /** Event type (e.g., COHORT_CREATED, SESSION_ATTENDED) */
  eventType: string;
  
  /** Entity type (e.g., Cohort, Session) */
  entityType: string;
  
  /** Entity ID */
  entityId: string;
  
  /** Source timestamp - when the event occurred */
  eventTs: Date;
  
  /** Schema version for the event data */
  schemaVersion: number;
  
  /** Event payload */
  data: Record<string, unknown>;
  
  /** Actor who triggered the event (optional for system events) */
  actorId?: string;
  
  /** Actor's role at time of event */
  actorRole?: string;
}

/**
 * Audit log entry
 */
export interface AuditEntry {
  /** Action performed */
  action: string;
  
  /** Target entity type */
  targetType: string;
  
  /** Target entity ID */
  targetId: string;
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Response from /api/elite/me endpoint
 */
export interface EliteMeResponse {
  tenantId: string;
  tenantName: string;
  
  user: {
    id: string;
    name: string;
    email: string;
  };
  
  orgMemberships: Array<{
    orgUnitId: string;
    orgUnitName: string;
    roleScope: EliteRole;
    isPrimary: boolean;
  }>;
  
  effectiveRole: EliteRole;
  effectivePermissions: ElitePermission[];
  
  cohortAccess: Array<{
    cohortId: string;
    cohortName: string;
    memberRole: string;
  }>;
  
  featureFlags: {
    ELITE_GRAPH_ENABLED: boolean;
    ELITE_ZOOM_ENABLED: boolean;
    [key: string]: boolean;
  };
  
  workspaceProfile: {
    id: string;
    version: number;
    modules: string[];
  } | null;
}

