/**
 * ELITE Service Kernel
 * 
 * Centralized exports for the ELITE workspace kernel.
 * All ELITE services and API routes should use these exports.
 */

// Types
export type {
  EliteContext,
  EliteEvent,
  AuditEntry,
  EliteMeResponse,
} from "./types";

// Context Resolution
export {
  resolveEliteContext,
  requireEliteContext,
} from "./context";

// Policy (Authorization)
export {
  ElitePolicy,
  createPolicy,
} from "./policy";

// Audit Logging
export {
  EliteAudit,
  createAudit,
  logSystemAction,
} from "./audit";

// Event Bus
export {
  EliteEventBus,
  createEventBus,
  emitSystemEvent,
  ELITE_EVENT_TYPES,
  type EliteEventType,
} from "./events";

