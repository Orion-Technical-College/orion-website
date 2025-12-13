/**
 * RBAC Sanity Tests
 * 
 * These tests ensure that permission assignments remain correct
 * and prevent accidental permission drift.
 * 
 * Run with: tsx src/__tests__/rbac.test.ts
 */

import { Role, ROLES, PERMISSIONS, ROLE_PERMISSIONS } from "@/lib/permissions";

interface TestResult {
  passed: boolean;
  message: string;
}

function runTest(name: string, test: () => boolean): TestResult {
  try {
    const passed = test();
    return {
      passed,
      message: passed ? `✅ ${name}` : `❌ ${name}`,
    };
  } catch (error: any) {
    return {
      passed: false,
      message: `❌ ${name}: ${error.message}`,
    };
  }
}

function runTests() {
  const results: TestResult[] = [];

  // Test 1: CLIENT_ADMIN cannot manage clients
  results.push(
    runTest("CLIENT_ADMIN cannot manage clients", () => {
      const clientAdminPerms = ROLE_PERMISSIONS[ROLES.CLIENT_ADMIN];
      return !clientAdminPerms.includes(PERMISSIONS.MANAGE_CLIENTS);
    })
  );

  // Test 2: CLIENT_USER cannot manage anything
  results.push(
    runTest("CLIENT_USER cannot manage users", () => {
      const clientUserPerms = ROLE_PERMISSIONS[ROLES.CLIENT_USER];
      return !clientUserPerms.includes(PERMISSIONS.MANAGE_CLIENT_USERS);
    })
  );

  results.push(
    runTest("CLIENT_USER cannot manage campaigns", () => {
      const clientUserPerms = ROLE_PERMISSIONS[ROLES.CLIENT_USER];
      return !clientUserPerms.includes(PERMISSIONS.MANAGE_CAMPAIGNS);
    })
  );

  // Test 3: Only PLATFORM_ADMIN can manage platform users
  results.push(
    runTest("Only PLATFORM_ADMIN can manage platform users", () => {
      const allRoles = Object.values(ROLES);
      for (const role of allRoles) {
        if (role === ROLES.PLATFORM_ADMIN) {
          continue; // Skip Platform Admin
        }
        const perms = ROLE_PERMISSIONS[role];
        if (perms.includes(PERMISSIONS.MANAGE_PLATFORM_USERS)) {
          return false;
        }
      }
      return true;
    })
  );

  // Test 4: Only PLATFORM_ADMIN can manage clients
  results.push(
    runTest("Only PLATFORM_ADMIN can manage clients", () => {
      const allRoles = Object.values(ROLES);
      for (const role of allRoles) {
        if (role === ROLES.PLATFORM_ADMIN) {
          continue; // Skip Platform Admin
        }
        const perms = ROLE_PERMISSIONS[role];
        if (perms.includes(PERMISSIONS.MANAGE_CLIENTS)) {
          return false;
        }
      }
      return true;
    })
  );

  // Test 5: Only PLATFORM_ADMIN can impersonate
  results.push(
    runTest("Only PLATFORM_ADMIN can impersonate users", () => {
      const allRoles = Object.values(ROLES);
      for (const role of allRoles) {
        if (role === ROLES.PLATFORM_ADMIN) {
          continue; // Skip Platform Admin
        }
        const perms = ROLE_PERMISSIONS[role];
        if (perms.includes(PERMISSIONS.IMPERSONATE_USERS)) {
          return false;
        }
      }
      return true;
    })
  );

  // Test 6: Only PLATFORM_ADMIN can view audit logs
  results.push(
    runTest("Only PLATFORM_ADMIN can view audit logs", () => {
      const allRoles = Object.values(ROLES);
      for (const role of allRoles) {
        if (role === ROLES.PLATFORM_ADMIN) {
          continue; // Skip Platform Admin
        }
        const perms = ROLE_PERMISSIONS[role];
        if (perms.includes(PERMISSIONS.VIEW_AUDIT_LOGS)) {
          return false;
        }
      }
      return true;
    })
  );

  // Test 7: RECRUITER cannot manage users
  results.push(
    runTest("RECRUITER cannot manage platform users", () => {
      const recruiterPerms = ROLE_PERMISSIONS[ROLES.RECRUITER];
      return !recruiterPerms.includes(PERMISSIONS.MANAGE_PLATFORM_USERS);
    })
  );

  results.push(
    runTest("RECRUITER cannot manage client users", () => {
      const recruiterPerms = ROLE_PERMISSIONS[ROLES.RECRUITER];
      return !recruiterPerms.includes(PERMISSIONS.MANAGE_CLIENT_USERS);
    })
  );

  // Test 8: CANDIDATE has no permissions
  results.push(
    runTest("CANDIDATE has no permissions", () => {
      const candidatePerms = ROLE_PERMISSIONS[ROLES.CANDIDATE];
      return candidatePerms.length === 0;
    })
  );

  // Test 9: All roles are defined in ROLES constant
  results.push(
    runTest("All roles in ROLE_PERMISSIONS are defined in ROLES", () => {
      const definedRoles = Object.values(ROLES);
      const permissionRoles = Object.keys(ROLE_PERMISSIONS) as Role[];
      for (const role of permissionRoles) {
        if (!definedRoles.includes(role)) {
          return false;
        }
      }
      return true;
    })
  );

  // Test 10: PLATFORM_ADMIN has all critical permissions
  results.push(
    runTest("PLATFORM_ADMIN has all critical permissions", () => {
      const platformAdminPerms = ROLE_PERMISSIONS[ROLES.PLATFORM_ADMIN];
      const criticalPerms = [
        PERMISSIONS.MANAGE_PLATFORM_USERS,
        PERMISSIONS.MANAGE_CLIENTS,
        PERMISSIONS.VIEW_AUDIT_LOGS,
        PERMISSIONS.IMPERSONATE_USERS,
      ];
      for (const perm of criticalPerms) {
        if (!platformAdminPerms.includes(perm)) {
          return false;
        }
      }
      return true;
    })
  );

  return results;
}

// Run tests if executed directly
if (require.main === module) {
  console.log("Running RBAC Sanity Tests...\n");
  const results = runTests();
  
  let passed = 0;
  let failed = 0;
  
  results.forEach((result) => {
    console.log(result.message);
    if (result.passed) {
      passed++;
    } else {
      failed++;
    }
  });
  
  console.log(`\n${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.error("\n❌ RBAC sanity checks failed! Review permission assignments.");
    process.exit(1);
  } else {
    console.log("\n✅ All RBAC sanity checks passed!");
    process.exit(0);
  }
}

export { runTests };

