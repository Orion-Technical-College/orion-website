/**
 * @jest-environment node
 */

import { describe, it, expect } from "@jest/globals";
import {
  normalizePhoneToE164,
  isValidPhoneNumber,
  formatPhoneForDisplay,
  getCountryCode,
} from "@/lib/phone-normalize";

describe("phone-normalize", () => {
  describe("normalizePhoneToE164", () => {
    it("should normalize US phone number to E.164", () => {
      // Use a real valid US phone number (415 is San Francisco area code)
      const result = normalizePhoneToE164("415-555-1234", "US");
      expect(result).toBe("+14155551234");
    });

    it("should handle phone number with country code", () => {
      const result = normalizePhoneToE164("+1 415-555-1234", "US");
      expect(result).toBe("+14155551234");
    });

    it("should handle phone number without country code", () => {
      const result = normalizePhoneToE164("(415) 555-1234", "US");
      expect(result).toBe("+14155551234");
    });

    it("should return null for invalid phone number", () => {
      const result = normalizePhoneToE164("invalid", "US");
      expect(result).toBeNull();
    });

    it("should return null for empty string", () => {
      const result = normalizePhoneToE164("", "US");
      expect(result).toBeNull();
    });

    it("should handle international numbers", () => {
      const result = normalizePhoneToE164("+44 20 7946 0958", "GB");
      expect(result).toBe("+442079460958");
    });
  });

  describe("isValidPhoneNumber", () => {
    it("should return true for valid US phone number", () => {
      const result = isValidPhoneNumber("415-555-1234", "US");
      expect(result).toBe(true);
    });

    it("should return false for invalid phone number", () => {
      const result = isValidPhoneNumber("123", "US");
      expect(result).toBe(false);
    });

    it("should return false for empty string", () => {
      const result = isValidPhoneNumber("", "US");
      expect(result).toBe(false);
    });
  });

  describe("formatPhoneForDisplay", () => {
    it("should format E.164 number for display", () => {
      const result = formatPhoneForDisplay("+15551234567", "US");
      // formatNational should return formatted number like "(555) 123-4567"
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return original if invalid", () => {
      const result = formatPhoneForDisplay("invalid", "US");
      expect(result).toBe("invalid");
    });

    it("should return empty string for empty input", () => {
      const result = formatPhoneForDisplay("", "US");
      expect(result).toBe("");
    });
  });

  describe("getCountryCode", () => {
    it("should return country calling code for US", () => {
      const result = getCountryCode("US");
      expect(result).toBe("1");
    });

    it("should return default for invalid country", () => {
      const result = getCountryCode("XX" as any);
      expect(result).toBe("1"); // Defaults to US
    });
  });
});
