import { PrismaClient } from "@prisma/client";
import { authorizeCredentials } from "../src/lib/auth-provider";

const prisma = new PrismaClient();

async function main() {
  console.log("Testing NextAuth flow simulation...\n");
  
  const email = "rjames@orion.edu";
  const password = "ChangeMe123!";
  
  // Simulate what NextAuth does - normalize email
  const normalizedEmail = email.trim().toLowerCase();
  console.log("Original email:", email);
  console.log("Normalized email:", normalizedEmail);
  console.log("");
  
  try {
    const result = await authorizeCredentials(
      {
        email: normalizedEmail,
        password: password,
        ip: "127.0.0.1",
      },
      prisma
    );
    
    if (result) {
      console.log("✅ authorizeCredentials returned:");
      console.log(JSON.stringify(result, null, 2));
      console.log("");
      console.log("✅ This should work in NextAuth");
      
      // Check if the return value matches what NextAuth expects
      const nextAuthUser = {
        id: result.id,
        email: result.email,
        name: result.name,
        role: result.role,
        clientId: result.clientId,
        isInternal: result.isInternal,
        mustChangePassword: result.mustChangePassword,
      };
      
      console.log("\nNextAuth user object:");
      console.log(JSON.stringify(nextAuthUser, null, 2));
    } else {
      console.log("❌ authorizeCredentials returned null");
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    if (error.message?.includes("Too many login attempts")) {
      console.log("⚠️  Rate limit is active");
    }
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
