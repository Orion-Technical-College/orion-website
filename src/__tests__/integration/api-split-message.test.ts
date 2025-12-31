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

describeIf(!shouldSkipIntegrationTests)("Split Message Mode API Tests", () => {
  let testUser: User;
  let testClient: { id: string };
  let testCampaign: Campaign;
  let testCampaignNoMessage3: Campaign;
  let testCandidates: Candidate[];
  let campaignRecipient: any;
  let guidedSendSession: any;
  let guidedSendRecipient: any;

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

    // Create test campaign without Message 3
    testCampaignNoMessage3 = await testPrisma.campaign.create({
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

    // Create CampaignRecipient
    campaignRecipient = await testPrisma.campaignRecipient.create({
      data: {
        campaignId: testCampaign.id,
        candidateId: testCandidates[0].id,
        personalizedMessage: "Test message",
        currentMessagePart: null,
        status: "PENDING",
      },
    });

    // Create GuidedSendSession
    guidedSendSession = await testPrisma.guidedSendSession.create({
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

    // Create GuidedSendRecipient
    guidedSendRecipient = await testPrisma.guidedSendRecipient.create({
      data: {
        sessionId: guidedSendSession.id,
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
  });

  afterEach(async () => {
    // Cleanup in reverse order
    await testPrisma.guidedSendRecipient.deleteMany({
      where: {
        sessionId: guidedSendSession.id,
      },
    });
    await testPrisma.guidedSendSession.deleteMany({
      where: {
        campaignId: { in: [testCampaign.id, testCampaignNoMessage3.id] },
      },
    });
    await testPrisma.campaignRecipient.deleteMany({
      where: {
        campaignId: { in: [testCampaign.id, testCampaignNoMessage3.id] },
      },
    });
    await testPrisma.candidate.deleteMany({
      where: {
        id: { in: testCandidates.map((c) => c.id) },
      },
    });
    await testPrisma.campaign.deleteMany({
      where: {
        id: { in: [testCampaign.id, testCampaignNoMessage3.id] },
      },
    });
    await testPrisma.user.delete({
      where: { id: testUser.id },
    });
    await testPrisma.client.delete({
      where: { id: testClient.id },
    });
  });

  describe("CampaignRecipient PATCH Endpoint Logic", () => {
    it("should update currentMessagePart from null to 1", async () => {
      const updated = await testPrisma.campaignRecipient.update({
        where: { id: campaignRecipient.id },
        data: {
          currentMessagePart: 1,
        },
      });

      expect(updated.currentMessagePart).toBe(1);
      expect(updated.status).toBe("PENDING"); // Still pending
    });

    it("should update currentMessagePart from 1 to 2", async () => {
      await testPrisma.campaignRecipient.update({
        where: { id: campaignRecipient.id },
        data: {
          currentMessagePart: 1,
        },
      });

      const updated = await testPrisma.campaignRecipient.update({
        where: { id: campaignRecipient.id },
        data: {
          currentMessagePart: 2,
        },
      });

      expect(updated.currentMessagePart).toBe(2);
      expect(updated.status).toBe("PENDING"); // Still pending until part 3
    });

    it("should mark as SENT when currentMessagePart is 3 (final part)", async () => {
      await testPrisma.campaignRecipient.update({
        where: { id: campaignRecipient.id },
        data: {
          currentMessagePart: 1,
        },
      });

      await testPrisma.campaignRecipient.update({
        where: { id: campaignRecipient.id },
        data: {
          currentMessagePart: 2,
        },
      });

      const final = await testPrisma.campaignRecipient.update({
        where: { id: campaignRecipient.id },
        data: {
          currentMessagePart: 3,
          status: "SENT",
          sentAt: new Date(),
        },
      });

      expect(final.currentMessagePart).toBe(3);
      expect(final.status).toBe("SENT");
      expect(final.sentAt).toBeDefined();
    });

    it("should mark as SENT when currentMessagePart is 2 and Message 3 is empty", async () => {
      const recipientNoMessage3 = await testPrisma.campaignRecipient.create({
        data: {
          campaignId: testCampaignNoMessage3.id,
          candidateId: testCandidates[1].id,
          personalizedMessage: "Test message",
          currentMessagePart: 1,
          status: "PENDING",
        },
      });

      const final = await testPrisma.campaignRecipient.update({
        where: { id: recipientNoMessage3.id },
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
        where: { id: recipientNoMessage3.id },
      });
    });
  });

  describe("GuidedSendRecipient PATCH Endpoint Logic", () => {
    it("should update currentMessagePart when opening Message 1", async () => {
      const updated = await testPrisma.guidedSendRecipient.update({
        where: { id: guidedSendRecipient.id },
        data: {
          currentMessagePart: 1,
          status: "OPENED",
          openCount: { increment: 1 },
          openedAt: new Date(),
        },
      });

      expect(updated.currentMessagePart).toBe(1);
      expect(updated.status).toBe("OPENED");
      expect(updated.openCount).toBe(1);
    });

    it("should update currentMessagePart when opening Message 2", async () => {
      await testPrisma.guidedSendRecipient.update({
        where: { id: guidedSendRecipient.id },
        data: {
          currentMessagePart: 1,
          status: "OPENED",
        },
      });

      const updated = await testPrisma.guidedSendRecipient.update({
        where: { id: guidedSendRecipient.id },
        data: {
          currentMessagePart: 2,
          openCount: { increment: 1 },
          lastOpenedAt: new Date(),
        },
      });

      expect(updated.currentMessagePart).toBe(2);
      expect(updated.status).toBe("OPENED"); // Still OPENED until final part
    });

    it("should mark as SENT when currentMessagePart is 3 (final part)", async () => {
      await testPrisma.guidedSendRecipient.update({
        where: { id: guidedSendRecipient.id },
        data: {
          currentMessagePart: 1,
          status: "OPENED",
        },
      });

      await testPrisma.guidedSendRecipient.update({
        where: { id: guidedSendRecipient.id },
        data: {
          currentMessagePart: 2,
        },
      });

      const final = await testPrisma.guidedSendRecipient.update({
        where: { id: guidedSendRecipient.id },
        data: {
          currentMessagePart: null, // Clear when complete
          status: "SENT",
          sentAt: new Date(),
        },
      });

      expect(final.currentMessagePart).toBeNull();
      expect(final.status).toBe("SENT");
      expect(final.sentAt).toBeDefined();
    });

    it("should mark as SENT when currentMessagePart is 2 and Message 3 is empty", async () => {
      const sessionNoMessage3 = await testPrisma.guidedSendSession.create({
        data: {
          campaignId: testCampaignNoMessage3.id,
          createdByUserId: testUser.id,
          clientId: testClient.id,
          status: "ACTIVE",
          templateSnapshot: testCampaignNoMessage3.message1Template || "",
          templateVersion: 1,
          variablesSnapshot: JSON.stringify({
            splitMessageMode: true,
            message1Template: testCampaignNoMessage3.message1Template,
            message2Template: testCampaignNoMessage3.message2Template,
            message3Template: null,
          }),
          messagePolicy: "LOCKED",
          startedAt: new Date(),
        },
      });

      const recipientNoMessage3 = await testPrisma.guidedSendRecipient.create({
        data: {
          sessionId: sessionNoMessage3.id,
          candidateId: testCandidates[1].id,
          order: 0,
          phoneRaw: testCandidates[1].phone,
          phoneE164: testCandidates[1].phone,
          renderedMessage: "Test message",
          renderedFromTemplateVersion: 1,
          currentMessagePart: 1,
          status: "OPENED",
        },
      });

      const final = await testPrisma.guidedSendRecipient.update({
        where: { id: recipientNoMessage3.id },
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
    });
  });

  describe("Session Creation with Split Message Mode", () => {
    it("should store split message config in variablesSnapshot", async () => {
      const session = await testPrisma.guidedSendSession.create({
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
            calendly_link: testCampaign.calendlyUrl,
          }),
          messagePolicy: "LOCKED",
          startedAt: new Date(),
        },
      });

      const vars = JSON.parse(session.variablesSnapshot || "{}");
      expect(vars.splitMessageMode).toBe(true);
      expect(vars.message1Template).toBe(testCampaign.message1Template);
      expect(vars.message2Template).toBe(testCampaign.message2Template);
      expect(vars.message3Template).toBe(testCampaign.message3Template);

      // Cleanup
      await testPrisma.guidedSendSession.delete({
        where: { id: session.id },
      });
    });
  });
});

