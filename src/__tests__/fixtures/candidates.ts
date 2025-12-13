import { faker } from "@faker-js/faker";
import { Prisma } from "@prisma/client";

/**
 * Standardized factory pattern for creating test candidates.
 * Usage: await prisma.candidate.create({ data: makeCandidate({ clientId: "client-1", status: "CONTACTED" }) });
 */
export function makeCandidate(
  overrides: Partial<Prisma.CandidateCreateInput> = {}
): Prisma.CandidateCreateInput {
  const defaultClientId = "default-client-id";

  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    status: "PENDING",
    source: faker.company.name(),
    jobTitle: faker.person.jobTitle(),
    location: `${faker.location.city()}, ${faker.location.state()}`,
    date: faker.date.recent().toISOString().split("T")[0],
    client: { connect: { id: overrides.client?.connect?.id || defaultClientId } },
    ...overrides,
  };
}

/**
 * Test data for different scenarios (various statuses, clients, locations).
 */
export const testCandidates = {
  pending: (clientId: string): Prisma.CandidateCreateInput =>
    makeCandidate({
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1234567890",
      status: "PENDING",
      client: { connect: { id: clientId } },
    }),

  contacted: (clientId: string): Prisma.CandidateCreateInput =>
    makeCandidate({
      name: "Jane Smith",
      email: "jane.smith@example.com",
      phone: "+1234567891",
      status: "CONTACTED",
      client: { connect: { id: clientId } },
    }),

  interviewed: (clientId: string): Prisma.CandidateCreateInput =>
    makeCandidate({
      name: "Bob Johnson",
      email: "bob.johnson@example.com",
      phone: "+1234567892",
      status: "INTERVIEWED",
      client: { connect: { id: clientId } },
    }),

  hired: (clientId: string): Prisma.CandidateCreateInput =>
    makeCandidate({
      name: "Alice Williams",
      email: "alice.williams@example.com",
      phone: "+1234567893",
      status: "HIRED",
      client: { connect: { id: clientId } },
    }),

  rejected: (clientId: string): Prisma.CandidateCreateInput =>
    makeCandidate({
      name: "Charlie Brown",
      email: "charlie.brown@example.com",
      phone: "+1234567894",
      status: "REJECTED",
      client: { connect: { id: clientId } },
    }),

  oakland: (clientId: string): Prisma.CandidateCreateInput =>
    makeCandidate({
      name: "Oakland Resident",
      email: "oakland@example.com",
      phone: "+1234567895",
      location: "Oakland, CA",
      client: { connect: { id: clientId } },
    }),

  sanFrancisco: (clientId: string): Prisma.CandidateCreateInput =>
    makeCandidate({
      name: "SF Resident",
      email: "sf@example.com",
      phone: "+1234567896",
      location: "San Francisco, CA",
      client: { connect: { id: clientId } },
    }),
};

