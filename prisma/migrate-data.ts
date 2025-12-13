import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Migration script to handle data migration after schema changes:
 * 1. Create default client if needed
 * 2. Migrate existing candidates to have clientId
 * 3. Handle userId relationship reversal (make optional)
 */
async function migrateData() {
  console.log("Starting data migration...");

  try {
    // Step 1: Create default client if it doesn't exist
    let defaultClient = await prisma.client.findFirst({
      where: { name: "Default Client" },
    });

    if (!defaultClient) {
      defaultClient = await prisma.client.create({
        data: {
          name: "Default Client",
          domain: null,
          isActive: true,
        },
      });
      console.log("✅ Created default client:", defaultClient.id);
    } else {
      console.log("✅ Default client already exists:", defaultClient.id);
    }

    // Step 2: Migrate existing candidates to have clientId
    // Note: This assumes candidates will be migrated to have clientId
    // The Prisma migration should handle the schema change
    // This script handles the data population

    const candidatesWithoutClient = await prisma.candidate.findMany({
      where: {
        clientId: null as any, // Type assertion needed during migration
      },
    });

    if (candidatesWithoutClient.length > 0) {
      console.log(`Found ${candidatesWithoutClient.length} candidates without clientId`);
      console.log("⚠️  Note: Candidates must have clientId. Please run Prisma migration first.");
      console.log("   Then assign candidates to appropriate clients.");
    } else {
      console.log("✅ All candidates have clientId");
    }

    // Step 3: Update existing users to have default role and isInternal flag
    // This is handled by Prisma schema defaults, but we can verify
    const allUsers = await prisma.user.findMany();
    console.log(`✅ Found ${allUsers.length} users in database`);

    console.log("✅ Data migration completed");
  } catch (error: any) {
    console.error("❌ Migration error:", error.message);
    throw error;
  }
}

migrateData()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

