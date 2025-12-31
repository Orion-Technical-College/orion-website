/**
 * Module System
 * 
 * Exports for the workspace module registry system.
 */

// Types
export type {
  LayoutSlot,
  ModuleNavigation,
  ModuleDefinition,
  ModuleConfig,
  WorkspaceModules,
  ValidationResult,
  ValidationError,
  ResolvedModule,
} from "./types";

// Registry
export {
  moduleRegistry,
  defineModule,
} from "./registry";

