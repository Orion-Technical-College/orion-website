import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("Testing database connection...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "✓ Set" : "✗ Not set");
    
    if (!process.env.DATABASE_URL) {
      console.log("\n⚠️  DATABASE_URL environment variable is not set.");
      console.log("Create a .env.local file with your DATABASE_URL.");
      process.exit(1);
    }

    // Try to connect
    await prisma.$connect();
    console.log("✓ Successfully connected to database");

    // Try a simple query
    const userCount = await prisma.user.count();
    console.log(`✓ Database is accessible (Users table exists, count: ${userCount})`);

    await prisma.$disconnect();
    console.log("✓ Connection closed");
    process.exit(0);
  } catch (error: any) {
    console.error("✗ Database connection failed:");
    console.error(error.message);
    
    if (error.code === "P1001") {
      console.error("\nPossible issues:");
      console.error("- Database server is not reachable");
      console.error("- Firewall rules may be blocking your IP");
      console.error("- DATABASE_URL connection string is incorrect");
    } else if (error.code === "P1000") {
      console.error("\nPossible issues:");
      console.error("- Authentication failed (wrong username/password)");
      console.error("- Database does not exist");
    }
    
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

testConnection();

