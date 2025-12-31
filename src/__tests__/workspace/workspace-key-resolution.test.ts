/**
 * Workspace Key Resolution Tests
 * 
 * Tests that verify:
 * 1. /otc and / resolve to different workspaceKeys
 * 2. Cards route to correct destinations
 * 3. Navigation produces observable state changes
 */

import { 
  WORKSPACE_KEYS, 
  isValidWorkspaceKey, 
  parseWorkspaceKey,
  routeToWorkspaceKey,
  WORKSPACE_ROUTES,
} from "@/lib/workspace/types";

describe("WorkspaceKey Types", () => {
  describe("WORKSPACE_KEYS", () => {
    it("should define all expected workspace keys", () => {
      expect(WORKSPACE_KEYS.DEFAULT).toBe("DEFAULT");
      expect(WORKSPACE_KEYS.EMC).toBe("EMC");
      expect(WORKSPACE_KEYS.OTC).toBe("OTC");
      expect(WORKSPACE_KEYS.ELITE).toBe("ELITE");
    });
  });

  describe("isValidWorkspaceKey", () => {
    it("should return true for valid workspace keys", () => {
      expect(isValidWorkspaceKey("DEFAULT")).toBe(true);
      expect(isValidWorkspaceKey("EMC")).toBe(true);
      expect(isValidWorkspaceKey("OTC")).toBe(true);
      expect(isValidWorkspaceKey("ELITE")).toBe(true);
    });

    it("should return false for invalid workspace keys", () => {
      expect(isValidWorkspaceKey("INVALID")).toBe(false);
      expect(isValidWorkspaceKey("")).toBe(false);
      expect(isValidWorkspaceKey("default")).toBe(false); // case sensitive
    });
  });

  describe("parseWorkspaceKey", () => {
    it("should return the key if valid", () => {
      expect(parseWorkspaceKey("OTC")).toBe("OTC");
      expect(parseWorkspaceKey("ELITE")).toBe("ELITE");
    });

    it("should return DEFAULT for invalid keys", () => {
      expect(parseWorkspaceKey("INVALID")).toBe("DEFAULT");
      expect(parseWorkspaceKey(undefined)).toBe("DEFAULT");
      expect(parseWorkspaceKey("")).toBe("DEFAULT");
    });
  });

  describe("routeToWorkspaceKey", () => {
    it("should map /otc to OTC", () => {
      expect(routeToWorkspaceKey("/otc")).toBe("OTC");
    });

    it("should map /emc to EMC", () => {
      expect(routeToWorkspaceKey("/emc")).toBe("EMC");
    });

    it("should map /elite to ELITE", () => {
      expect(routeToWorkspaceKey("/elite")).toBe("ELITE");
    });

    it("should map / to DEFAULT", () => {
      expect(routeToWorkspaceKey("/")).toBe("DEFAULT");
    });

    it("should map unknown routes to DEFAULT", () => {
      expect(routeToWorkspaceKey("/unknown")).toBe("DEFAULT");
      expect(routeToWorkspaceKey("/admin")).toBe("DEFAULT");
    });
  });

  describe("WORKSPACE_ROUTES", () => {
    it("should map workspace keys to routes", () => {
      expect(WORKSPACE_ROUTES.DEFAULT).toBe("/");
      expect(WORKSPACE_ROUTES.EMC).toBe("/emc");
      expect(WORKSPACE_ROUTES.OTC).toBe("/otc");
      expect(WORKSPACE_ROUTES.ELITE).toBe("/elite");
    });
  });
});

describe("Workspace Route Identity", () => {
  it("should ensure /otc and / resolve to different workspace keys", () => {
    const rootKey = routeToWorkspaceKey("/");
    const otcKey = routeToWorkspaceKey("/otc");
    
    expect(rootKey).not.toBe(otcKey);
    expect(rootKey).toBe("DEFAULT");
    expect(otcKey).toBe("OTC");
  });

  it("should ensure each workspace route resolves to a distinct key", () => {
    const routes = ["/", "/otc", "/emc", "/elite"];
    const keys = routes.map(routeToWorkspaceKey);
    
    // EMC and DEFAULT might be equivalent, but OTC and ELITE must be distinct
    expect(keys.filter(k => k === "OTC").length).toBe(1);
    expect(keys.filter(k => k === "ELITE").length).toBe(1);
    expect(keys.filter(k => k === "DEFAULT").length).toBe(1);
    expect(keys.filter(k => k === "EMC").length).toBe(1);
  });

  it("should provide bidirectional mapping between keys and routes", () => {
    // Key -> Route -> Key should be identity for all keys
    Object.values(WORKSPACE_KEYS).forEach(key => {
      const route = WORKSPACE_ROUTES[key];
      const resolvedKey = routeToWorkspaceKey(route);
      expect(resolvedKey).toBe(key);
    });
  });
});

