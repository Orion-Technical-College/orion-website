import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "kweed@emcsupport.com";
  
  console.log("Checking user:", email);
  
  // Try case-insensitive search
  const users = await prisma.$queryRaw<Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    passwordHash: string | null;
    mustChangePassword: boolean | null;
  }>>`
    SELECT id, email, name, role, "isActive", "passwordHash", "mustChangePassword"
    FROM "User"
    WHERE LOWER(email) = LOWER(${email.toLowerCase()})
    LIMIT 1
  `;
  
  if (users.length === 0) {
    console.log("❌ User not found in database");
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
  
  if (!user.isActive) {
    console.log("\n⚠️  User account is INACTIVE - this will prevent login");
  }
  
  if (!user.passwordHash) {
    console.log("\n⚠️  User has NO PASSWORD HASH - login will fail");
  }
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
