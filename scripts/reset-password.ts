import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Get email and password from command line arguments
  const email = process.argv[2] || "rjames@orion.edu";
  const newPassword = process.argv[3] || "ChangeMe123!";
  
  if (!email || !newPassword) {
    console.error("Usage: npx tsx scripts/reset-password.ts <email> <newPassword>");
    process.exit(1);
  }
  
  console.log(`Resetting password for: ${email}`);
  
  // Use case-insensitive lookup (same as auth-provider.ts)
  const users = await prisma.$queryRaw<Array<{
    id: string;
    email: string;
  }>>`
    SELECT id, email
    FROM "User"
    WHERE LOWER(email) = LOWER(${email.toLowerCase()})
    LIMIT 1
  `;
  
  if (users.length === 0) {
    console.error(`❌ User not found: ${email}`);
    process.exit(1);
  }
  
  const user = users[0];
  const hash = await bcrypt.hash(newPassword, 10);
  
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hash }
  });
  
  console.log(`✅ Password reset successful for: ${user.email}`);
  console.log(`New password: ${newPassword}`);
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

