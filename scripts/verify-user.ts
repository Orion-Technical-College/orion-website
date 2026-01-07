import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "rjames@orion.edu";
  const password = "ChangeMe123!";
  
  console.log("Checking user:", email);
  
  // Try to find user with case-insensitive search
  const users = await prisma.$queryRaw<Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    passwordHash: string | null;
    isActive: boolean;
  }>>`
    SELECT id, email, name, role, "passwordHash", "isActive"
    FROM "User"
    WHERE LOWER(email) = LOWER(${email.toLowerCase()})
    LIMIT 1
  `;
  
  if (users.length === 0) {
    console.log("❌ User not found in database");
    return;
  }
  
  const user = users[0];
  console.log("✅ User found:");
  console.log("  ID:", user.id);
  console.log("  Email:", user.email);
  console.log("  Name:", user.name);
  console.log("  Role:", user.role);
  console.log("  Is Active:", user.isActive);
  console.log("  Has Password Hash:", !!user.passwordHash);
  
  if (!user.passwordHash) {
    console.log("❌ User has no password hash");
    return;
  }
  
  if (!user.isActive) {
    console.log("❌ User is not active");
    return;
  }
  
  // Test password
  const isValid = await bcrypt.compare(password, user.passwordHash);
  console.log("\nPassword verification:");
  console.log("  Password provided:", password);
  console.log("  Hash matches:", isValid);
  
  if (isValid) {
    console.log("\n✅ User credentials are valid!");
  } else {
    console.log("\n❌ Password does not match hash");
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
