import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get email from command line argument or use default
  const email = process.argv[2] || "kweed@emcsupport.com";
  
  console.log("=== User Account Diagnostic ===\n");
  console.log("Checking user:", email);
  
  // Try case-insensitive search using raw SQL (same as auth-provider.ts)
  const users = await prisma.$queryRaw<Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    passwordHash: string | null;
    mustChangePassword: boolean | null;
    createdAt: Date;
    updatedAt: Date;
  }>>`
    SELECT id, email, name, role, "isActive", "passwordHash", "mustChangePassword", "createdAt", "updatedAt"
    FROM "User"
    WHERE LOWER(email) = LOWER(${email.toLowerCase()})
    LIMIT 1
  `;
  
  if (users.length === 0) {
    console.log("\n❌ User not found in database");
    console.log("\nPossible issues:");
    console.log("  1. User account doesn't exist");
    console.log("  2. Email address is incorrect");
    console.log("  3. User was deleted");
    console.log("\n💡 Solution: Create the user account or verify the email address");
    return;
  }
  
  const user = users[0];
  console.log("\n✅ User found:");
  console.log("  ID:", user.id);
  console.log("  Email:", user.email);
  console.log("  Name:", user.name);
  console.log("  Role:", user.role);
  console.log("  Is Active:", user.isActive);
  console.log("  Has Password Hash:", !!user.passwordHash);
  console.log("  Must Change Password:", user.mustChangePassword);
  console.log("  Created:", user.createdAt.toISOString());
  console.log("  Updated:", user.updatedAt.toISOString());
  
  console.log("\n=== Account Status ===");
  
  const issues: string[] = [];
  const warnings: string[] = [];
  
  if (!user.isActive) {
    issues.push("❌ Account is INACTIVE - login will be blocked");
  } else {
    console.log("✅ Account is active");
  }
  
  if (!user.passwordHash) {
    issues.push("❌ No password hash - login will fail");
  } else {
    console.log("✅ Password hash exists");
  }
  
  if (user.mustChangePassword) {
    warnings.push("⚠️  User must change password on next login");
  }
  
  if (issues.length > 0) {
    console.log("\n⚠️  Issues found:");
    issues.forEach(issue => console.log("  ", issue));
    console.log("\n💡 Solutions:");
    if (!user.isActive) {
      console.log("  - Activate the user account (use admin panel or API)");
    }
    if (!user.passwordHash) {
      console.log("  - Reset the user's password:");
      console.log(`    npx tsx scripts/reset-password.ts ${email} NewPassword123!`);
    }
  } else {
    console.log("\n✅ Account appears to be in good standing");
    if (warnings.length > 0) {
      console.log("\n⚠️  Warnings:");
      warnings.forEach(warning => console.log("  ", warning));
    }
    console.log("\nIf login still fails, possible causes:");
    console.log("  1. Incorrect password");
    console.log("  2. Password needs to be reset");
    console.log("  3. Browser/cache issues");
    console.log("  4. Rate limiting (too many failed attempts)");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Error:", e.message);
    if (e.message?.includes("DATABASE_URL")) {
      console.error("\n💡 Make sure DATABASE_URL is set in your environment");
      console.error("   For production: Use Azure App Service connection string");
    }
    await prisma.$disconnect();
    process.exit(1);
  });
