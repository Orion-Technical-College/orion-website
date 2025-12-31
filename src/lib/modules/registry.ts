/**
 * Module Registry
 * 
 * Central registry for workspace modules per ADR-001.
 * Handles module registration, validation, and resolution.
 */

import type {
  ModuleDefinition,
  ModuleConfig,
  ValidationResult,
  ValidationError,
  ResolvedModule,
} from "./types";
import type { ElitePermission } from "../elite/permissions";

/**
 * Module Registry implementation
 */
class ModuleRegistryImpl {
  private modules: Map<string, ModuleDefinition> = new Map();
  private routeMap: Map<string, string> = new Map(); // route -> moduleKey

  /**
   * Register a module with the registry
   * Validates the module and checks for route collisions
   */
  register(module: ModuleDefinition): void {
    // Validate module definition
    this.validateModuleDefinition(module);

    // Check for route collisions
    for (const route of module.routes) {
      const existingModule = this.routeMap.get(route);
      if (existingModule && existingModule !== module.moduleKey) {
        throw new Error(
          `Route collision: "${route}" is already registered by module "${existingModule}"`
        );
      }
    }

    // Register routes
    for (const route of module.routes) {
      this.routeMap.set(route, module.moduleKey);
    }

    // Register module
    this.modules.set(module.moduleKey, module);
  }

  /**
   * Get a module by key
   */
  get(moduleKey: string): ModuleDefinition | undefined {
    return this.modules.get(moduleKey);
  }

  /**
   * Check if a module is registered
   */
  has(moduleKey: string): boolean {
    return this.modules.has(moduleKey);
  }

  /**
   * Get all registered modules
   */
  getAll(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }

  /**
   * Find module by route
   */
  findByRoute(route: string): ModuleDefinition | undefined {
    // Try exact match first
    const moduleKey = this.routeMap.get(route);
    if (moduleKey) {
      return this.modules.get(moduleKey);
    }

    // Try pattern matching for dynamic routes (e.g., /elite/cohorts/[id])
    const entries = Array.from(this.routeMap.entries());
    for (const [registeredRoute, key] of entries) {
      if (this.routeMatches(registeredRoute, route)) {
        return this.modules.get(key);
      }
    }

    return undefined;
  }

  /**
   * Resolve modules for a workspace profile
   * Filters by permissions and feature flags, sorts by order
   */
  resolveForProfile(
    moduleConfigs: ModuleConfig[],
    userPermissions: ElitePermission[],
    featureFlags: Record<string, boolean>
  ): ResolvedModule[] {
    const resolved: ResolvedModule[] = [];

    for (const config of moduleConfigs) {
      const definition = this.modules.get(config.moduleKey);
      if (!definition) {
        console.warn(`[ModuleRegistry] Module not found: ${config.moduleKey}`);
        continue;
      }

      // Check permissions
      const hasAllPermissions = definition.requiredPermissions.every(
        (perm) => userPermissions.includes(perm)
      );
      if (!hasAllPermissions) {
        continue;
      }

      // Check feature flags
      if (definition.requiredFeatureFlags) {
        const hasAllFlags = definition.requiredFeatureFlags.every(
          (flag) => featureFlags[flag] === true
        );
        if (!hasAllFlags) {
          continue;
        }
      }

      resolved.push({
        moduleKey: config.moduleKey,
        definition,
        config,
        navigation: definition.navigation
          ? {
              ...definition.navigation,
              label: config.labelOverride ?? definition.navigation.label,
            }
          : undefined,
      });
    }

    // Sort by order
    resolved.sort((a, b) => a.config.order - b.config.order);

    return resolved;
  }

  /**
   * Validate the entire registry for consistency
   */
  validate(): ValidationResult {
    const errors: ValidationError[] = [];

    const moduleEntries = Array.from(this.modules.entries());
    for (const [moduleKey, module] of moduleEntries) {
      // Check dependencies
      if (module.dependsOn) {
        for (const dep of module.dependsOn) {
          if (!this.modules.has(dep)) {
            errors.push({
              type: "missing_dependency",
              message: `Module "${moduleKey}" depends on "${dep}" which is not registered`,
              moduleKey,
              details: { dependency: dep },
            });
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate routes for collisions
   */
  validateRoutes(): ValidationResult {
    const errors: ValidationError[] = [];
    const routeModules: Map<string, string[]> = new Map();

    const moduleEntries = Array.from(this.modules.entries());
    for (const [moduleKey, module] of moduleEntries) {
      for (const route of module.routes) {
        const existing = routeModules.get(route) ?? [];
        existing.push(moduleKey);
        routeModules.set(route, existing);
      }
    }

    const routeEntries = Array.from(routeModules.entries());
    for (const [route, moduleKeys] of routeEntries) {
      if (moduleKeys.length > 1) {
        errors.push({
          type: "route_collision",
          message: `Route "${route}" is registered by multiple modules: ${moduleKeys.join(", ")}`,
          details: { route, modules: moduleKeys },
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Clear all registered modules (for testing)
   */
  clear(): void {
    this.modules.clear();
    this.routeMap.clear();
  }

  // ============================================
  // Private methods
  // ============================================

  private validateModuleDefinition(module: ModuleDefinition): void {
    if (!module.moduleKey) {
      throw new Error("Module must have a moduleKey");
    }
    if (module.moduleApiVersion !== 1) {
      throw new Error(`Unsupported moduleApiVersion: ${module.moduleApiVersion}`);
    }
    if (!module.routes || module.routes.length === 0) {
      throw new Error(`Module "${module.moduleKey}" must have at least one route`);
    }
    if (!module.requiredPermissions) {
      throw new Error(`Module "${module.moduleKey}" must specify requiredPermissions`);
    }
    if (!module.component) {
      throw new Error(`Module "${module.moduleKey}" must have a component`);
    }
  }

  private routeMatches(pattern: string, route: string): boolean {
    // Convert Next.js dynamic route pattern to regex
    // e.g., "/elite/cohorts/[id]" -> /^\/elite\/cohorts\/[^/]+$/
    const regexPattern = pattern
      .replace(/\[([^\]]+)\]/g, "[^/]+")
      .replace(/\//g, "\\/");
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(route);
  }
}

/**
 * Singleton module registry instance
 */
export const moduleRegistry = new ModuleRegistryImpl();

/**
 * Helper to create a module definition with type safety
 */
export function defineModule(module: ModuleDefinition): ModuleDefinition {
  return module;
}

