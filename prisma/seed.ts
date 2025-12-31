import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // ============================================
  // 1. Create Orion Technical College client
  // ============================================
  let orionClient = await prisma.client.findFirst({
    where: { name: "Orion Technical College" },
  });

  if (!orionClient) {
    orionClient = await prisma.client.create({
      data: {
        name: "Orion Technical College",
        domain: "orion.edu",
        isActive: true,
      },
    });
    console.log("✅ Created client: Orion Technical College");
  } else {
    console.log("Client already exists: Orion Technical College");
  }

  // ============================================
  // 2. Create Platform Admin user (rjames@orion.edu)
  // ============================================
  const adminEmail = process.env.PLATFORM_ADMIN_EMAIL || "rjames@orion.edu";
  const adminName = process.env.PLATFORM_ADMIN_NAME || "Rodney James";
  const adminPassword = process.env.PLATFORM_ADMIN_PASSWORD || "ChangeMe123!";

  let platformAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!platformAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    platformAdmin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        role: "PLATFORM_ADMIN",
        passwordHash,
        isActive: true,
        isInternal: true,
        authProvider: "credentials",
        authProviderId: null,
        emailVerified: null,
        mustChangePassword: false, // Already changed
        clientId: orionClient.id, // Link to Orion Technical College for ELITE access
      },
    });

    // Update authProviderId to user.id for credentials provider
    await prisma.user.update({
      where: { id: platformAdmin.id },
      data: { authProviderId: platformAdmin.id },
    });

    console.log("✅ Created Platform Admin:", adminEmail);
  } else {
    // Update existing user to have clientId if not set
    if (!platformAdmin.clientId) {
      platformAdmin = await prisma.user.update({
        where: { id: platformAdmin.id },
        data: { clientId: orionClient.id },
      });
      console.log("✅ Updated Platform Admin with clientId");
    } else {
      console.log("Platform Admin already exists:", adminEmail);
    }
  }

  // ============================================
  // 3. Create OrgUnit for Orion Technical College
  // ============================================
  let orionOrgUnit = await prisma.orgUnit.findFirst({
    where: {
      clientId: orionClient.id,
      name: "Leadership Programs",
    },
  });

  if (!orionOrgUnit) {
    orionOrgUnit = await prisma.orgUnit.create({
      data: {
        clientId: orionClient.id,
        name: "Leadership Programs",
      },
    });
    console.log("✅ Created OrgUnit: Leadership Programs");
  } else {
    console.log("OrgUnit already exists: Leadership Programs");
  }

  // ============================================
  // 4. Create UserOrgMembership for ELITE access
  // ============================================
  const existingMembership = await prisma.userOrgMembership.findFirst({
    where: {
      clientId: orionClient.id,
      userId: platformAdmin.id,
      orgUnitId: orionOrgUnit.id,
    },
  });

  if (!existingMembership) {
    await prisma.userOrgMembership.create({
      data: {
        clientId: orionClient.id,
        userId: platformAdmin.id,
        orgUnitId: orionOrgUnit.id,
        roleScope: "PROGRAM_ADMIN", // ELITE admin role
        isPrimary: true,
        status: "ACTIVE",
      },
    });
    console.log("✅ Created ELITE admin membership for:", adminEmail);
  } else {
    console.log("ELITE membership already exists for:", adminEmail);
  }

  // ============================================
  // 5. Create a sample Program Template
  // ============================================
  let programTemplate = await prisma.programTemplate.findFirst({
    where: {
      clientId: orionClient.id,
      name: "ELITE Leadership Fundamentals",
    },
  });

  if (!programTemplate) {
    programTemplate = await prisma.programTemplate.create({
      data: {
        clientId: orionClient.id,
        name: "ELITE Leadership Fundamentals",
        description: "A comprehensive leadership development program covering core competencies, emotional intelligence, and strategic thinking.",
        status: "PUBLISHED",
      },
    });

    // Create an initial version
    await prisma.programTemplateVersion.create({
      data: {
        clientId: orionClient.id,
        templateId: programTemplate.id,
        versionNumber: 1,
        syllabus: JSON.stringify({
          modules: [
            { name: "Leadership Foundations", duration: "2 weeks" },
            { name: "Emotional Intelligence", duration: "2 weeks" },
            { name: "Strategic Thinking", duration: "2 weeks" },
            { name: "Team Leadership", duration: "2 weeks" },
          ],
          totalDuration: "8 weeks",
        }),
        effectiveFrom: new Date(),
        publishedAt: new Date(),
        publishedBy: platformAdmin.id,
        status: "PUBLISHED",
      },
    });

    console.log("✅ Created Program Template: ELITE Leadership Fundamentals");
  } else {
    console.log("Program Template already exists: ELITE Leadership Fundamentals");
  }

  // ============================================
  // 6. Create a Workspace Profile for ELITE
  // ============================================
  let workspaceProfile = await prisma.workspaceProfile.findFirst({
    where: {
      clientId: orionClient.id,
      workspaceKey: "ELITE",
    },
  });

  if (!workspaceProfile) {
    workspaceProfile = await prisma.workspaceProfile.create({
      data: {
        clientId: orionClient.id,
        workspaceKey: "ELITE",
        name: "ELITE Leadership Workspace",
        description: "Full ELITE workspace with all modules enabled",
      },
    });

    // Create an initial version with all modules
    await prisma.workspaceProfileVersion.create({
      data: {
        clientId: orionClient.id,
        profileId: workspaceProfile.id,
        versionNumber: 1,
        modules: JSON.stringify([
          "elite.dashboard",
          "elite.cohorts",
          "elite.sessions",
          "elite.coaching",
          "elite.learnerProfiles",
          "elite.assignments",
          "elite.artifacts",
          "elite.analytics",
          "elite.admin",
        ]),
        layoutConfig: JSON.stringify({
          theme: "default",
          navigation: "sidebar",
        }),
        effectiveFrom: new Date(),
        publishedAt: new Date(),
        publishedBy: platformAdmin.id,
        status: "PUBLISHED",
      },
    });

    console.log("✅ Created Workspace Profile: ELITE Leadership Workspace");
  } else {
    console.log("Workspace Profile already exists: ELITE Leadership Workspace");
  }

  // ============================================
  // Summary
  // ============================================
  console.log("\n========================================");
  console.log("🎉 Seed completed successfully!");
  console.log("========================================");
  console.log("\nELITE Admin Setup:");
  console.log("  User:", adminEmail);
  console.log("  Tenant:", orionClient.name);
  console.log("  Role: PROGRAM_ADMIN");
  console.log("  OrgUnit:", orionOrgUnit.name);
  console.log("\nYou can now access the ELITE workspace at /elite");
  console.log("========================================\n");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
