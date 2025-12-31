/**
 * Module Registry Types
 * 
 * Defines the contract for workspace modules per ADR-001.
 */

import type { ComponentType } from "react";
import type { ElitePermission } from "../elite/permissions";

/**
 * Layout slots where modules can be rendered
 */
export type LayoutSlot = "left_nav" | "main" | "right_panel" | "bottom_sheet";

/**
 * Module navigation metadata
 */
export interface ModuleNavigation {
  /** Route path (e.g., "/elite/cohorts") */
  path: string;
  /** Display label */
  label: string;
  /** Lucide icon name */
  icon: string;
  /** Order in navigation (lower = higher) */
  order: number;
}

/**
 * Module definition contract
 * All modules must implement this interface
 */
export interface ModuleDefinition {
  /** Unique module identifier (e.g., "elite.cohorts") */
  moduleKey: string;
  
  /** Module API version - for compatibility checking */
  moduleApiVersion: 1;
  
  /** Where the module renders */
  layoutSlot: LayoutSlot;
  
  /** Navigation metadata for modules with routes */
  navigation?: ModuleNavigation;
  
  /** All routes this module handles (for collision detection) */
  routes: string[];
  
  /** Permissions required to access this module */
  requiredPermissions: ElitePermission[];
  
  /** Feature flags required for this module */
  requiredFeatureFlags?: string[];
  
  /** Capabilities this module provides (for dependency resolution) */
  capabilities?: string[];
  
  /** Other modules this module depends on */
  dependsOn?: string[];
  
  /** Module component (lazy loaded) */
  component: () => Promise<{ default: ComponentType }>;
}

/**
 * Module configuration in a workspace profile
 */
export interface ModuleConfig {
  /** Module key */
  moduleKey: string;
  /** Order in the layout */
  order: number;
  /** Module-specific configuration */
  config?: Record<string, unknown>;
  /** Override navigation label */
  labelOverride?: string;
}

/**
 * Workspace profile module list
 */
export interface WorkspaceModules {
  modules: ModuleConfig[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error
 */
export interface ValidationError {
  type: "route_collision" | "missing_dependency" | "missing_capability" | "invalid_module";
  message: string;
  moduleKey?: string;
  details?: Record<string, unknown>;
}

/**
 * Resolved module for rendering
 */
export interface ResolvedModule {
  moduleKey: string;
  definition: ModuleDefinition;
  config: ModuleConfig;
  navigation?: ModuleNavigation;
}

