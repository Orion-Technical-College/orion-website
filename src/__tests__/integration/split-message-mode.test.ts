/**
 * @jest-environment node
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import type { User, Candidate, Campaign } from "@prisma/client";

// Skip integration tests if DATABASE_URL is not configured or doesn't contain "_test"
const shouldSkipIntegrationTests =
  !process.env.DATABASE_URL ||
  !process.env.DATABASE_URL.includes("_test") ||
  process.env.NODE_ENV !== "test";

const describeIf = (condition: boolean) => condition ? describe : describe.skip;

// Only import testPrisma if we're not skipping tests
let testPrisma: any;
if (!shouldSkipIntegrationTests) {
  testPrisma = require("../setup/db").testPrisma;
}

describeIf(!shouldSkipIntegrationTests)("Split Message Mode Integration Tests", () => {
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
        clientId: testClient.id,
      },
    });

    // Create test campaign with split message mode
    testCampaign = await testPrisma.campaign.create({
      data: {
        userId: testUser.id,
        name: "Split Message Campaign",
        messageTemplate: "Hi {{name}}, test message",
        message1Template: "Hi {{name}}, thanks for your interest.",
        message2Template: "Book a call: {{calendly_link}}",
        message3Template: "Let me know if you didn't see the link!",
        splitMessageMode: true,
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
    ]);
  });

  afterEach(async () => {
    // Cleanup in reverse order
    await testPrisma.campaignRecipient.deleteMany({
      where: {
        campaignId: testCampaign.id,
      },
    });
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

  describe("Campaign Split Message Mode", () => {
    it("should create campaign with split message mode enabled", async () => {
      const campaign = await testPrisma.campaign.findUnique({
        where: { id: testCampaign.id },
      });

      expect(campaign).toBeDefined();
      expect(campaign?.splitMessageMode).toBe(true);
      expect(campaign?.message1Template).toBe("Hi {{name}}, thanks for your interest.");
      expect(campaign?.message2Template).toBe("Book a call: {{calendly_link}}");
      expect(campaign?.message3Template).toBe("Let me know if you didn't see the link!");
    });

    it("should create campaign with split mode disabled by default", async () => {
      const regularCampaign = await testPrisma.campaign.create({
        data: {
          userId: testUser.id,
          name: "Regular Campaign",
          messageTemplate: "Hi {{name}}, test message",
          status: "ACTIVE",
        },
      });

      expect(regularCampaign.splitMessageMode).toBe(false);
      expect(regularCampaign.message1Template).toBeNull();
      expect(regularCampaign.message2Template).toBeNull();
      expect(regularCampaign.message3Template).toBeNull();

      // Cleanup
      await testPrisma.campaign.delete({
        where: { id: regularCampaign.id },
      });
    });
  });

  describe("CampaignRecipient currentMessagePart Tracking", () => {
    it("should track currentMessagePart for split message mode", async () => {
      const recipient = await testPrisma.campaignRecipient.create({
        data: {
          campaignId: testCampaign.id,
          candidateId: testCandidates[0].id,
          personalizedMessage: "Test message",
          currentMessagePart: 1,
          status: "PENDING",
        },
      });

      expect(recipient.currentMessagePart).toBe(1);
      expect(recipient.status).toBe("PENDING");

      // Update to part 2
      const updated = await testPrisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: {
          currentMessagePart: 2,
        },
      });

      expect(updated.currentMessagePart).toBe(2);
      expect(updated.status).toBe("PENDING"); // Still pending until final part

      // Update to part 3 (final)
      const final = await testPrisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: {
          currentMessagePart: 3,
          status: "SENT",
          sentAt: new Date(),
        },
      });

      expect(final.currentMessagePart).toBe(3);
      expect(final.status).toBe("SENT");
    });

    it("should allow null currentMessagePart for non-split campaigns", async () => {
      const regularCampaign = await testPrisma.campaign.create({
        data: {
          userId: testUser.id,
          name: "Regular Campaign",
          messageTemplate: "Hi {{name}}, test message",
          status: "ACTIVE",
        },
      });

      const recipient = await testPrisma.campaignRecipient.create({
        data: {
          campaignId: regularCampaign.id,
          candidateId: testCandidates[0].id,
          personalizedMessage: "Test message",
          currentMessagePart: null,
          status: "PENDING",
        },
      });

      expect(recipient.currentMessagePart).toBeNull();

      // Cleanup
      await testPrisma.campaignRecipient.delete({
        where: { id: recipient.id },
      });
      await testPrisma.campaign.delete({
        where: { id: regularCampaign.id },
      });
    });
  });

  describe("GuidedSendRecipient currentMessagePart Tracking", () => {
    let session: any;

    beforeEach(async () => {
      session = await testPrisma.guidedSendSession.create({
        data: {
          campaignId: testCampaign.id,
          createdByUserId: testUser.id,
          clientId: testClient.id,
          status: "ACTIVE",
          templateSnapshot: testCampaign.message1Template || "",
          templateVersion: 1,
          variablesSnapshot: JSON.stringify({
            splitMessageMode: true,
            message1Template: testCampaign.message1Template,
            message2Template: testCampaign.message2Template,
            message3Template: testCampaign.message3Template,
          }),
          messagePolicy: "LOCKED",
          startedAt: new Date(),
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

    it("should track currentMessagePart through message sequence", async () => {
      const recipient = await testPrisma.guidedSendRecipient.create({
        data: {
          sessionId: session.id,
          candidateId: testCandidates[0].id,
          order: 0,
          phoneRaw: testCandidates[0].phone,
          phoneE164: testCandidates[0].phone,
          renderedMessage: "Test message",
          renderedFromTemplateVersion: 1,
          currentMessagePart: null,
          status: "PENDING",
        },
      });

      // Send Message 1
      const afterPart1 = await testPrisma.guidedSendRecipient.update({
        where: { id: recipient.id },
        data: {
          currentMessagePart: 1,
          status: "OPENED",
          openCount: 1,
          openedAt: new Date(),
        },
      });

      expect(afterPart1.currentMessagePart).toBe(1);
      expect(afterPart1.status).toBe("OPENED");

      // Send Message 2
      const afterPart2 = await testPrisma.guidedSendRecipient.update({
        where: { id: recipient.id },
        data: {
          currentMessagePart: 2,
          openCount: { increment: 1 },
          lastOpenedAt: new Date(),
        },
      });

      expect(afterPart2.currentMessagePart).toBe(2);
      expect(afterPart2.status).toBe("OPENED"); // Still OPENED until final part

      // Send Message 3 (final)
      const afterPart3 = await testPrisma.guidedSendRecipient.update({
        where: { id: recipient.id },
        data: {
          currentMessagePart: null, // Clear when complete
          status: "SENT",
          sentAt: new Date(),
        },
      });

      expect(afterPart3.currentMessagePart).toBeNull();
      expect(afterPart3.status).toBe("SENT");
    });

    it("should handle split mode with only 2 messages (no Message 3)", async () => {
      const campaignNoMessage3 = await testPrisma.campaign.create({
        data: {
          userId: testUser.id,
          name: "Campaign No Message 3",
          messageTemplate: "Hi {{name}}, test",
          message1Template: "Hi {{name}}",
          message2Template: "Link: {{calendly_link}}",
          message3Template: null, // No Message 3
          splitMessageMode: true,
          calendlyUrl: "https://calendly.com/test",
          status: "ACTIVE",
        },
      });

      const sessionNoMessage3 = await testPrisma.guidedSendSession.create({
        data: {
          campaignId: campaignNoMessage3.id,
          createdByUserId: testUser.id,
          clientId: testClient.id,
          status: "ACTIVE",
          templateSnapshot: campaignNoMessage3.message1Template || "",
          templateVersion: 1,
          variablesSnapshot: JSON.stringify({
            splitMessageMode: true,
            message1Template: campaignNoMessage3.message1Template,
            message2Template: campaignNoMessage3.message2Template,
            message3Template: null,
          }),
          messagePolicy: "LOCKED",
          startedAt: new Date(),
        },
      });

      const recipient = await testPrisma.guidedSendRecipient.create({
        data: {
          sessionId: sessionNoMessage3.id,
          candidateId: testCandidates[0].id,
          order: 0,
          phoneRaw: testCandidates[0].phone,
          phoneE164: testCandidates[0].phone,
          renderedMessage: "Test message",
          renderedFromTemplateVersion: 1,
          currentMessagePart: null,
          status: "PENDING",
        },
      });

      // Send Message 1
      await testPrisma.guidedSendRecipient.update({
        where: { id: recipient.id },
        data: {
          currentMessagePart: 1,
          status: "OPENED",
        },
      });

      // Send Message 2 (final when Message 3 is null)
      const final = await testPrisma.guidedSendRecipient.update({
        where: { id: recipient.id },
        data: {
          currentMessagePart: null,
          status: "SENT",
          sentAt: new Date(),
        },
      });

      expect(final.currentMessagePart).toBeNull();
      expect(final.status).toBe("SENT");

      // Cleanup
      await testPrisma.guidedSendRecipient.deleteMany({
        where: { sessionId: sessionNoMessage3.id },
      });
      await testPrisma.guidedSendSession.delete({
        where: { id: sessionNoMessage3.id },
      });
      await testPrisma.campaign.delete({
        where: { id: campaignNoMessage3.id },
      });
    });
  });

  describe("Status Logic for Split Messages", () => {
    it("should keep CampaignRecipient as PENDING until all parts are sent", async () => {
      const recipient = await testPrisma.campaignRecipient.create({
        data: {
          campaignId: testCampaign.id,
          candidateId: testCandidates[0].id,
          personalizedMessage: "Test message",
          currentMessagePart: 1,
          status: "PENDING",
        },
      });

      // Part 1 sent - still PENDING
      expect(recipient.status).toBe("PENDING");

      // Part 2 sent - still PENDING
      const afterPart2 = await testPrisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: {
          currentMessagePart: 2,
        },
      });
      expect(afterPart2.status).toBe("PENDING");

      // Part 3 sent - now SENT
      const afterPart3 = await testPrisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: {
          currentMessagePart: 3,
          status: "SENT",
          sentAt: new Date(),
        },
      });
      expect(afterPart3.status).toBe("SENT");
    });

    it("should mark as SENT after Message 2 when Message 3 is empty", async () => {
      const campaignNoMessage3 = await testPrisma.campaign.create({
        data: {
          userId: testUser.id,
          name: "Campaign No Message 3",
          messageTemplate: "Hi {{name}}",
          message1Template: "Hi {{name}}",
          message2Template: "Link: {{calendly_link}}",
          message3Template: null,
          splitMessageMode: true,
          calendlyUrl: "https://calendly.com/test",
          status: "ACTIVE",
        },
      });

      const recipient = await testPrisma.campaignRecipient.create({
        data: {
          campaignId: campaignNoMessage3.id,
          candidateId: testCandidates[0].id,
          personalizedMessage: "Test message",
          currentMessagePart: 1,
          status: "PENDING",
        },
      });

      // Part 2 sent - should be SENT (no Message 3)
      const final = await testPrisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: {
          currentMessagePart: 2,
          status: "SENT",
          sentAt: new Date(),
        },
      });

      expect(final.currentMessagePart).toBe(2);
      expect(final.status).toBe("SENT");

      // Cleanup
      await testPrisma.campaignRecipient.delete({
        where: { id: recipient.id },
      });
      await testPrisma.campaign.delete({
        where: { id: campaignNoMessage3.id },
      });
    });
  });
});

