/**
 * @jest-environment node
 */

import { describe, it, expect } from "@jest/globals";
import { canSendSms, getBlockedReason } from "@/lib/candidate-validation";
import type { Candidate } from "@/types";

describe("candidate-validation", () => {
  const createMockCandidate = (overrides: Partial<Candidate> = {}): Candidate => {
    return {
      id: "1",
      name: "Test Candidate",
      email: "test@example.com",
      phone: "+14155551234",
      source: "Indeed",
      client: "Client A",
      jobTitle: "Developer",
      location: "San Francisco, CA",
      date: "2025-01-01",
      status: "pending",
      notes: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  };

  describe("canSendSms", () => {
    it("should allow SMS for opted-in candidate with valid phone", () => {
      const candidate = createMockCandidate({
        smsConsentStatus: "OPTED_IN",
        phone: "415-555-1234", // Use real valid US phone number
      });

      const result = canSendSms(candidate, "US");

      expect(result.allowed).toBe(true);
      expect(result.status).toBe("ALLOWED");
    });

    it("should block SMS for opted-out candidate", () => {
      const candidate = createMockCandidate({
        smsConsentStatus: "OPTED_OUT",
        phone: "+15551234567",
      });

      const result = canSendSms(candidate);

      expect(result.allowed).toBe(false);
      expect(result.status).toBe("BLOCKED");
      expect(result.reason).toContain("opted out");
    });

    it("should block SMS for unknown consent status", () => {
      const candidate = createMockCandidate({
        smsConsentStatus: "UNKNOWN",
        phone: "+15551234567",
      });

      const result = canSendSms(candidate);

      expect(result.allowed).toBe(false);
      expect(result.status).toBe("BLOCKED");
      expect(result.reason).toContain("consent status is unknown");
    });

    it("should block SMS if smsOptOutAt is set", () => {
      const candidate = createMockCandidate({
        smsConsentStatus: "OPTED_IN",
        smsOptOutAt: new Date(),
        phone: "+15551234567",
      });

      const result = canSendSms(candidate);

      expect(result.allowed).toBe(false);
      expect(result.status).toBe("BLOCKED");
    });

    it("should return INVALID_PHONE if phone is missing", () => {
      const candidate = createMockCandidate({
        smsConsentStatus: "OPTED_IN",
        phone: "",
      });

      const result = canSendSms(candidate);

      expect(result.allowed).toBe(false);
      expect(result.status).toBe("INVALID_PHONE");
      expect(result.reason).toContain("No phone number provided");
    });

    it("should return INVALID_PHONE for invalid phone format", () => {
      const candidate = createMockCandidate({
        smsConsentStatus: "OPTED_IN",
        phone: "invalid-phone",
      });

      const result = canSendSms(candidate, "US");

      expect(result.allowed).toBe(false);
      expect(result.status).toBe("INVALID_PHONE");
    });
  });

  describe("getBlockedReason", () => {
    it("should return OPTED_OUT for opted-out candidate", () => {
      const candidate = createMockCandidate({
        smsConsentStatus: "OPTED_OUT",
      });

      const reason = getBlockedReason(candidate, "+15551234567");

      expect(reason).toBe("OPTED_OUT");
    });

    it("should return OPTED_OUT if smsOptOutAt is set", () => {
      const candidate = createMockCandidate({
        smsConsentStatus: "OPTED_IN",
        smsOptOutAt: new Date(),
      });

      const reason = getBlockedReason(candidate, "+15551234567");

      expect(reason).toBe("OPTED_OUT");
    });

    it("should return CONSENT_UNKNOWN for unknown consent", () => {
      const candidate = createMockCandidate({
        smsConsentStatus: "UNKNOWN",
      });

      const reason = getBlockedReason(candidate, "+15551234567");

      expect(reason).toBe("CONSENT_UNKNOWN");
    });

    it("should return INVALID_PHONE if phoneE164 is null", () => {
      const candidate = createMockCandidate({
        smsConsentStatus: "OPTED_IN",
      });

      const reason = getBlockedReason(candidate, null);

      expect(reason).toBe("INVALID_PHONE");
    });

    it("should return null for allowed candidate", () => {
      const candidate = createMockCandidate({
        smsConsentStatus: "OPTED_IN",
      });

      const reason = getBlockedReason(candidate, "+15551234567");

      expect(reason).toBeNull();
    });
  });
});
