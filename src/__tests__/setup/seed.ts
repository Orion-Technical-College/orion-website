import { testPrisma } from "./db";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";

/**
 * Seed test database with minimal data using Prisma.
 * Creates test users for each role, test clients, and test candidates.
 */
export async function seedTestDatabase() {
  // Create test clients
  const client1 = await testPrisma.client.upsert({
    where: { id: "test-client-1" },
    update: {},
    create: {
      id: "test-client-1",
      name: "Test Client 1",
      domain: "testclient1.com",
      isActive: true,
    },
  });

  const client2 = await testPrisma.client.upsert({
    where: { id: "test-client-2" },
    update: {},
    create: {
      id: "test-client-2",
      name: "Test Client 2",
      domain: "testclient2.com",
      isActive: true,
    },
  });

  // Create test users for each role
  const passwordHash = await bcrypt.hash("TestPassword123!", 10);

  const platformAdmin = await testPrisma.user.upsert({
    where: { email: "platform-admin@test.com" },
    update: {},
    create: {
      email: "platform-admin@test.com",
      name: "Platform Admin",
      role: "PLATFORM_ADMIN",
      passwordHash,
      isActive: true,
      isInternal: true,
      authProvider: "credentials",
      authProviderId: "platform-admin-id",
      emailVerified: new Date(),
    },
  });

  const recruiter = await testPrisma.user.upsert({
    where: { email: "recruiter@test.com" },
    update: {},
    create: {
      email: "recruiter@test.com",
      name: "Test Recruiter",
      role: "RECRUITER",
      passwordHash,
      isActive: true,
      isInternal: true,
      authProvider: "credentials",
      authProviderId: "recruiter-id",
      emailVerified: new Date(),
    },
  });

  const clientAdmin = await testPrisma.user.upsert({
    where: { email: "client-admin@test.com" },
    update: {},
    create: {
      email: "client-admin@test.com",
      name: "Client Admin",
      role: "CLIENT_ADMIN",
      passwordHash,
      isActive: true,
      isInternal: false,
      clientId: client1.id,
      authProvider: "credentials",
      authProviderId: "client-admin-id",
      emailVerified: new Date(),
    },
  });

  const clientUser = await testPrisma.user.upsert({
    where: { email: "client-user@test.com" },
    update: {},
    create: {
      email: "client-user@test.com",
      name: "Client User",
      role: "CLIENT_USER",
      passwordHash,
      isActive: true,
      isInternal: false,
      clientId: client1.id,
      authProvider: "credentials",
      authProviderId: "client-user-id",
      emailVerified: new Date(),
    },
  });

  // Create test candidates
  const candidate1 = await testPrisma.candidate.upsert({
    where: { id: "test-candidate-1" },
    update: {},
    create: {
      id: "test-candidate-1",
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1234567890",
      status: "PENDING",
      clientId: client1.id,
      recruiterId: recruiter.id,
    },
  });

  const candidate2 = await testPrisma.candidate.upsert({
    where: { id: "test-candidate-2" },
    update: {},
    create: {
      id: "test-candidate-2",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      phone: "+1234567891",
      status: "CONTACTED",
      clientId: client1.id,
      recruiterId: recruiter.id,
    },
  });

  const candidate3 = await testPrisma.candidate.upsert({
    where: { id: "test-candidate-3" },
    update: {},
    create: {
      id: "test-candidate-3",
      name: "Bob Johnson",
      email: "bob.johnson@example.com",
      phone: "+1234567892",
      status: "PENDING",
      clientId: client2.id,
      recruiterId: recruiter.id,
    },
  });

  return {
    clients: { client1, client2 },
    users: { platformAdmin, recruiter, clientAdmin, clientUser },
    candidates: { candidate1, candidate2, candidate3 },
  };
}

