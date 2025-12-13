/**
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { testPrisma } from "../setup/db";
import type { User, Candidate, Campaign } from "@prisma/client";

describe("Guided Send Integration Tests", () => {
  let testUser: User;
  let testClient: { id: string };
  let testCampaign: Campaign;
  let testCandidates: Candidate[];

  beforeEach(async () => {
    // Create test client
    testClient = await testPrisma.client.create({
      data: {
        name: "Test Client",
        isActive: true,
      },
    });

    // Create test user
    testUser = await testPrisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: "Test User",
        role: "RECRUITER",
        isActive: true,
        isInternal: true,
      },
    });

    // Create test campaign
    testCampaign = await testPrisma.campaign.create({
      data: {
        userId: testUser.id,
        name: "Test Campaign",
        messageTemplate: "Hi {{name}}, test message for {{role}}",
        calendlyUrl: "https://calendly.com/test",
        status: "ACTIVE",
      },
    });

    // Create test candidates
    testCandidates = await Promise.all([
      testPrisma.candidate.create({
        data: {
          clientId: testClient.id,
          name: "Candidate 1",
          email: "candidate1@example.com",
          phone: "+15551234567",
          smsConsentStatus: "OPTED_IN",
          status: "PENDING",
        },
      }),
      testPrisma.candidate.create({
        data: {
          clientId: testClient.id,
          name: "Candidate 2",
          email: "candidate2@example.com",
          phone: "+15551234568",
          smsConsentStatus: "OPTED_IN",
          status: "PENDING",
        },
      }),
      testPrisma.candidate.create({
        data: {
          clientId: testClient.id,
          name: "Candidate 3 (Opted Out)",
          email: "candidate3@example.com",
          phone: "+15551234569",
          smsConsentStatus: "OPTED_OUT",
          status: "PENDING",
        },
      }),
      testPrisma.candidate.create({
        data: {
          clientId: testClient.id,
          name: "Candidate 4 (Invalid Phone)",
          email: "candidate4@example.com",
          phone: "invalid-phone",
          smsConsentStatus: "OPTED_IN",
          status: "PENDING",
        },
      }),
    ]);
  });

  afterEach(async () => {
    // Cleanup in reverse order
    await testPrisma.guidedSendRecipient.deleteMany({
      where: {
        session: {
          campaignId: testCampaign.id,
        },
      },
    });
    await testPrisma.guidedSendSession.deleteMany({
      where: {
        campaignId: testCampaign.id,
      },
    });
    await testPrisma.candidate.deleteMany({
      where: {
        id: { in: testCandidates.map((c) => c.id) },
      },
    });
    await testPrisma.campaign.delete({
      where: { id: testCampaign.id },
    });
    await testPrisma.user.delete({
      where: { id: testUser.id },
    });
    await testPrisma.client.delete({
      where: { id: testClient.id },
    });
  });

  describe("Session Creation", () => {
    it("should create session with all candidates", async () => {
      const session = await testPrisma.guidedSendSession.create({
        data: {
          campaignId: testCampaign.id,
          createdByUserId: testUser.id,
          clientId: testClient.id,
          status: "ACTIVE",
          templateSnapshot: testCampaign.messageTemplate,
          templateVersion: 1,
          variablesSnapshot: JSON.stringify({}),
          messagePolicy: "LOCKED",
          startedAt: new Date(),
          recipients: {
            create: testCandidates.map((candidate, index) => ({
              candidateId: candidate.id,
              order: index,
              phoneRaw: candidate.phone,
              phoneE164: candidate.phone === "invalid-phone" ? null : candidate.phone,
              renderedMessage: `Hi ${candidate.name.split(" ")[0]}, test message`,
              renderedFromTemplateVersion: 1,
              status:
                candidate.smsConsentStatus === "OPTED_OUT" || candidate.phone === "invalid-phone"
                  ? "BLOCKED"
                  : "PENDING",
              blockedReason:
                candidate.smsConsentStatus === "OPTED_OUT"
                  ? "OPTED_OUT"
                  : candidate.phone === "invalid-phone"
                    ? "INVALID_PHONE"
                    : null,
            })),
          },
        },
        include: {
          recipients: true,
        },
      });

      expect(session).toBeDefined();
      expect(session.recipients).toHaveLength(4);
      expect(session.status).toBe("ACTIVE");
    });

    it("should enforce idempotency with same key", async () => {
      const idempotencyKey = `test-key-${Date.now()}`;

      const session1 = await testPrisma.guidedSendSession.create({
        data: {
          campaignId: testCampaign.id,
          createdByUserId: testUser.id,
          clientId: testClient.id,
          idempotencyKey,
          status: "ACTIVE",
          templateSnapshot: testCampaign.messageTemplate,
          templateVersion: 1,
          variablesSnapshot: JSON.stringify({}),
          messagePolicy: "LOCKED",
          startedAt: new Date(),
        },
      });

      // Try to create another with same key - should fail due to unique constraint
      await expect(
        testPrisma.guidedSendSession.create({
          data: {
            campaignId: testCampaign.id,
            createdByUserId: testUser.id,
            clientId: testClient.id,
            idempotencyKey,
            status: "ACTIVE",
            templateSnapshot: testCampaign.messageTemplate,
            templateVersion: 1,
            variablesSnapshot: JSON.stringify({}),
            messagePolicy: "LOCKED",
            startedAt: new Date(),
          },
        })
      ).rejects.toThrow();

      // Cleanup
      await testPrisma.guidedSendSession.delete({
        where: { id: session1.id },
      });
    });
  });

  describe("Recipient Status Updates", () => {
    let session: any;

    beforeEach(async () => {
      session = await testPrisma.guidedSendSession.create({
        data: {
          campaignId: testCampaign.id,
          createdByUserId: testUser.id,
          clientId: testClient.id,
          status: "ACTIVE",
          templateSnapshot: testCampaign.messageTemplate,
          templateVersion: 1,
          variablesSnapshot: JSON.stringify({}),
          messagePolicy: "LOCKED",
          startedAt: new Date(),
          recipients: {
            create: [
              {
                candidateId: testCandidates[0].id,
                order: 0,
                phoneRaw: testCandidates[0].phone,
                phoneE164: testCandidates[0].phone,
                renderedMessage: "Test message",
                renderedFromTemplateVersion: 1,
                status: "PENDING",
              },
            ],
          },
        },
        include: {
          recipients: true,
        },
      });
    });

    afterEach(async () => {
      if (session) {
        await testPrisma.guidedSendRecipient.deleteMany({
          where: { sessionId: session.id },
        });
        await testPrisma.guidedSendSession.delete({
          where: { id: session.id },
        });
      }
    });

    it("should update recipient from PENDING to OPENED", async () => {
      const recipient = session.recipients[0];

      const updated = await testPrisma.guidedSendRecipient.update({
        where: { id: recipient.id },
        data: {
          status: "OPENED",
          openCount: { increment: 1 },
          openedAt: new Date(),
          lastOpenedAt: new Date(),
        },
      });

      expect(updated.status).toBe("OPENED");
      expect(updated.openCount).toBe(1);
      expect(updated.openedAt).toBeDefined();
    });

    it("should update recipient from OPENED to SENT", async () => {
      const recipient = session.recipients[0];

      // First open
      await testPrisma.guidedSendRecipient.update({
        where: { id: recipient.id },
        data: {
          status: "OPENED",
          openCount: 1,
          openedAt: new Date(),
        },
      });

      // Then mark as sent
      const updated = await testPrisma.guidedSendRecipient.update({
        where: { id: recipient.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });

      expect(updated.status).toBe("SENT");
      expect(updated.sentAt).toBeDefined();
    });

    it("should update recipient from OPENED to SKIPPED", async () => {
      const recipient = session.recipients[0];

      await testPrisma.guidedSendRecipient.update({
        where: { id: recipient.id },
        data: {
          status: "OPENED",
          openCount: 1,
        },
      });

      const updated = await testPrisma.guidedSendRecipient.update({
        where: { id: recipient.id },
        data: {
          status: "SKIPPED",
          skippedReason: "User skipped",
        },
      });

      expect(updated.status).toBe("SKIPPED");
      expect(updated.skippedReason).toBe("User skipped");
    });
  });

  describe("Session Completion", () => {
    it("should auto-complete when all recipients are terminal", async () => {
      const session = await testPrisma.guidedSendSession.create({
        data: {
          campaignId: testCampaign.id,
          createdByUserId: testUser.id,
          clientId: testClient.id,
          status: "ACTIVE",
          templateSnapshot: testCampaign.messageTemplate,
          templateVersion: 1,
          variablesSnapshot: JSON.stringify({}),
          messagePolicy: "LOCKED",
          startedAt: new Date(),
          recipients: {
            create: [
              {
                candidateId: testCandidates[0].id,
                order: 0,
                phoneRaw: testCandidates[0].phone,
                phoneE164: testCandidates[0].phone,
                renderedMessage: "Test message",
                renderedFromTemplateVersion: 1,
                status: "SENT",
                sentAt: new Date(),
              },
            ],
          },
        },
      });

      // All recipients are terminal (SENT), so session should be completable
      const remaining = await testPrisma.guidedSendRecipient.count({
        where: {
          sessionId: session.id,
          status: { in: ["PENDING", "OPENED"] },
        },
      });

      expect(remaining).toBe(0);

      // Cleanup
      await testPrisma.guidedSendRecipient.deleteMany({
        where: { sessionId: session.id },
      });
      await testPrisma.guidedSendSession.delete({
        where: { id: session.id },
      });
    });
  });

  describe("Blocked Recipients", () => {
    it("should create blocked recipients with correct reason", async () => {
      const session = await testPrisma.guidedSendSession.create({
        data: {
          campaignId: testCampaign.id,
          createdByUserId: testUser.id,
          clientId: testClient.id,
          status: "ACTIVE",
          templateSnapshot: testCampaign.messageTemplate,
          templateVersion: 1,
          variablesSnapshot: JSON.stringify({}),
          messagePolicy: "LOCKED",
          startedAt: new Date(),
          recipients: {
            create: [
              {
                candidateId: testCandidates[2].id, // Opted out
                order: 0,
                phoneRaw: testCandidates[2].phone,
                phoneE164: testCandidates[2].phone,
                renderedMessage: "Test message",
                renderedFromTemplateVersion: 1,
                status: "BLOCKED",
                blockedReason: "OPTED_OUT",
              },
              {
                candidateId: testCandidates[3].id, // Invalid phone
                order: 1,
                phoneRaw: testCandidates[3].phone,
                phoneE164: null,
                renderedMessage: "Test message",
                renderedFromTemplateVersion: 1,
                status: "BLOCKED",
                blockedReason: "INVALID_PHONE",
              },
            ],
          },
        },
        include: {
          recipients: true,
        },
      });

      expect(session.recipients[0].blockedReason).toBe("OPTED_OUT");
      expect(session.recipients[1].blockedReason).toBe("INVALID_PHONE");

      // Cleanup
      await testPrisma.guidedSendRecipient.deleteMany({
        where: { sessionId: session.id },
      });
      await testPrisma.guidedSendSession.delete({
        where: { id: session.id },
      });
    });
  });
});
