import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "rjames@orion.edu";
  const newPassword = "ChangeMe123!";
  
  const hash = await bcrypt.hash(newPassword, 10);
  
  const user = await prisma.user.update({
    where: { email },
    data: { passwordHash: hash }
  });
  
  console.log(`Password reset for: ${user.email}`);
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

