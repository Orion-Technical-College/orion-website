import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "rjames@orion.edu";
  
  // Get user
  const user = await prisma.user.findUnique({
    where: { email },
    include: { client: true }
  });
  
  if (!user) {
    console.log("User not found:", email);
    return;
  }
  
  console.log("\n========== USER INFO ==========");
  console.log("User ID:", user.id);
  console.log("Email:", user.email);
  console.log("Name:", user.name);
  console.log("Platform Role:", user.role);
  console.log("Client ID:", user.clientId);
  console.log("Client Name:", user.client?.name);
  
  // Get org memberships
  console.log("\n========== ORG MEMBERSHIPS ==========");
  const orgMemberships = await prisma.userOrgMembership.findMany({
    where: {
      userId: user.id,
      status: "ACTIVE"
    },
    include: {
      orgUnit: true
    }
  });
  
  if (orgMemberships.length === 0) {
    console.log("No org memberships found");
  } else {
    for (const membership of orgMemberships) {
      console.log(`- ${membership.orgUnit.name}: ${membership.roleScope} (${membership.isPrimary ? "Primary" : "Secondary"})`);
    }
  }
  
  // Get workspace profiles
  console.log("\n========== WORKSPACE PROFILES ==========");
  const workspaceProfiles = await prisma.workspaceProfile.findMany({
    where: { clientId: user.clientId! },
    include: {
      versions: {
        where: { status: "PUBLISHED" },
        orderBy: { versionNumber: "desc" },
        take: 1
      }
    }
  });
  
  if (workspaceProfiles.length === 0) {
    console.log("No workspace profiles found");
  } else {
    for (const profile of workspaceProfiles) {
      console.log(`- ${profile.name} (${profile.workspaceKey})`);
      if (profile.versions.length > 0) {
        const v = profile.versions[0];
        console.log(`  Version: ${v.versionNumber}, Modules: ${v.modules}`);
      }
    }
  }
  
  // Summary of what workspaces the user should see
  console.log("\n========== EXPECTED WORKSPACES ==========");
  
  // 1. Tenant workspace
  console.log("1. Tenant Workspace:");
  console.log(`   - Name: ${user.client?.name || "EMC Workspace"}`);
  console.log(`   - Badge: Admin (PLATFORM_ADMIN)`);
  
  // 2. ELITE workspace
  const hasEliteAccess = orgMemberships.length > 0;
  const eliteRoles = orgMemberships.map(m => m.roleScope);
  let eliteBadge = "New";
  if (eliteRoles.includes("PROGRAM_ADMIN")) eliteBadge = "Admin";
  else if (eliteRoles.includes("LEADERSHIP")) eliteBadge = "Leadership";
  else if (eliteRoles.includes("COACH") || eliteRoles.includes("INSTRUCTOR")) eliteBadge = "Staff";
  else if (eliteRoles.includes("LEARNER")) eliteBadge = "Learner";
  
  console.log("2. ELITE Leadership:");
  console.log(`   - Available: ${hasEliteAccess}`);
  console.log(`   - Badge: ${eliteBadge}`);
  
  // 3. Platform Admin
  console.log("3. Platform Admin:");
  console.log(`   - Available: ${user.role === "PLATFORM_ADMIN"}`);
  console.log(`   - Badge: Admin`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

