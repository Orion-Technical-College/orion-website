import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get the first user and client for test data
  const user = await prisma.user.findFirst();
  const client = await prisma.client.findFirst();
  
  if (!user || !client) {
    console.error("No user or client found in database");
    process.exit(1);
  }

  console.log(`Using user: ${user.email}, client: ${client.name}`);

  // Delete any existing test candidates
  await prisma.candidate.deleteMany({
    where: {
      email: { in: ["test1@example.com", "test2@example.com"] }
    }
  });

  // Create test candidates
  const testCandidates = [
    {
      name: "Test Candidate 1",
      email: "test1@example.com",
      phone: "+15551234567",
      source: "Test",
      jobTitle: "Software Engineer",
      location: "New York, NY",
      status: "pending",
      smsConsentStatus: "OPTED_IN",
      smsOptInAt: new Date(),
      smsOptInSource: "Web Form",
      clientId: client.id,
      userId: user.id,
    },
    {
      name: "Test Candidate 2", 
      email: "test2@example.com",
      phone: "+15559876543",
      source: "Test",
      jobTitle: "Product Manager",
      location: "San Francisco, CA",
      status: "pending",
      smsConsentStatus: "OPTED_IN",
      smsOptInAt: new Date(),
      smsOptInSource: "Web Form",
      clientId: client.id,
      userId: user.id,
    },
  ];

  const createdIds: string[] = [];
  for (const candidate of testCandidates) {
    const created = await prisma.candidate.create({
      data: candidate,
    });
    createdIds.push(created.id);
    console.log(`Created candidate: ${created.name} (${created.id})`);
  }

  console.log("\nTest candidate IDs for use in testing:");
  console.log(JSON.stringify(createdIds));
  console.log("\nDone creating test candidates!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
