import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Create default client if it doesn't exist
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
    console.log("Created default client:", defaultClient.id);
  }

  // Create initial Platform Admin user
  const adminEmail = process.env.PLATFORM_ADMIN_EMAIL || "rjames@orion.edu";
  const adminName = process.env.PLATFORM_ADMIN_NAME || "Rodney James";
  const adminPassword = process.env.PLATFORM_ADMIN_PASSWORD || "ChangeMe123!";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("Platform Admin already exists:", adminEmail);
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const platformAdmin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: adminName,
      role: "PLATFORM_ADMIN",
      passwordHash,
      isActive: true,
      isInternal: true,
      authProvider: "credentials",
      authProviderId: null, // Will be set to user.id after creation
      emailVerified: null,
      mustChangePassword: true, // Force password change on first login
    },
  });

  // Update authProviderId to user.id for credentials provider
  await prisma.user.update({
    where: { id: platformAdmin.id },
    data: { authProviderId: platformAdmin.id },
  });

  console.log("✅ Created Platform Admin:");
  console.log("   Name:", adminName);
  console.log("   Email:", adminEmail);
  console.log("   Password:", adminPassword);
  console.log("   ⚠️  Please change the password after first login!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

