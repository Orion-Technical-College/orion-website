import { faker } from "@faker-js/faker";
import { Prisma } from "@prisma/client";
import { ROLES } from "@/lib/permissions";

/**
 * Standardized factory pattern for creating test users.
 * Usage: await prisma.user.create({ data: makeUser({ role: "PLATFORM_ADMIN" }) });
 */
export function makeUser(overrides: Partial<Prisma.UserCreateInput> = {}): Prisma.UserCreateInput {
  return {
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: ROLES.RECRUITER,
    isActive: true,
    isInternal: false,
    authProvider: "credentials",
    authProviderId: faker.string.uuid(),
    emailVerified: new Date(),
    mustChangePassword: false,
    ...overrides,
  };
}

/**
 * Pre-defined test users for each role.
 */
export const testUsers = {
  platformAdmin: (): Prisma.UserCreateInput =>
    makeUser({
      email: "platform-admin@test.com",
      name: "Platform Admin",
      role: ROLES.PLATFORM_ADMIN,
      isInternal: true,
    }),

  recruiter: (): Prisma.UserCreateInput =>
    makeUser({
      email: "recruiter@test.com",
      name: "Test Recruiter",
      role: ROLES.RECRUITER,
      isInternal: true,
    }),

  clientAdmin: (clientId: string): Prisma.UserCreateInput =>
    makeUser({
      email: "client-admin@test.com",
      name: "Client Admin",
      role: ROLES.CLIENT_ADMIN,
      isInternal: false,
      client: { connect: { id: clientId } },
    }),

  clientUser: (clientId: string): Prisma.UserCreateInput =>
    makeUser({
      email: "client-user@test.com",
      name: "Client User",
      role: ROLES.CLIENT_USER,
      isInternal: false,
      client: { connect: { id: clientId } },
    }),

  candidate: (clientId: string): Prisma.UserCreateInput =>
    makeUser({
      email: "candidate@test.com",
      name: "Test Candidate",
      role: ROLES.CANDIDATE,
      isInternal: false,
      client: { connect: { id: clientId } },
    }),
};

/**
 * Create test clients.
 */
export function makeClient(overrides: Partial<Prisma.ClientCreateInput> = {}): Prisma.ClientCreateInput {
  return {
    name: faker.company.name(),
    domain: faker.internet.domainName(),
    isActive: true,
    ...overrides,
  };
}

export const testClients = {
  client1: (): Prisma.ClientCreateInput =>
    makeClient({
      id: "test-client-1",
      name: "Test Client 1",
      domain: "testclient1.com",
    }),

  client2: (): Prisma.ClientCreateInput =>
    makeClient({
      id: "test-client-2",
      name: "Test Client 2",
      domain: "testclient2.com",
    }),
};

