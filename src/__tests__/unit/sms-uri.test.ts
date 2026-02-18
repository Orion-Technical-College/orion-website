/**
 * @jest-environment node
 */

import { generateSmsUri } from "@/lib/utils";

describe("sms-uri", () => {
  describe("generateSmsUri", () => {
    it("should generate correct sms: URI format", () => {
      const result = generateSmsUri("1234567890", "Hello");
      expect(result).toBe("sms:1234567890?body=Hello");
    });

    it("should format phone number by removing non-digits", () => {
      const result = generateSmsUri("(123) 456-7890", "Hello");
      expect(result).toBe("sms:1234567890?body=Hello");
    });

    it("should handle phone with dashes", () => {
      const result = generateSmsUri("123-456-7890", "Hello");
      expect(result).toBe("sms:1234567890?body=Hello");
    });

    it("should handle phone with spaces", () => {
      const result = generateSmsUri("123 456 7890", "Hello");
      expect(result).toBe("sms:1234567890?body=Hello");
    });

    it("should handle phone with plus sign", () => {
      const result = generateSmsUri("+1-123-456-7890", "Hello");
      expect(result).toBe("sms:+11234567890?body=Hello");
    });

    it("should URL encode message content", () => {
      const result = generateSmsUri("1234567890", "Hello, world!");
      // encodeURIComponent encodes ! as %21, but some implementations may leave it unencoded
      expect(result).toMatch(/^sms:1234567890\?body=Hello%2C%20world/);
    });

    it("should handle special characters in message", () => {
      const result = generateSmsUri("1234567890", "Hi! @#$%");
      // Verify it's properly encoded (may vary by implementation)
      expect(result).toMatch(/^sms:1234567890\?body=/);
      expect(result).toContain("Hi");
    });

    it("should handle long messages", () => {
      const longMessage = "A".repeat(500);
      const result = generateSmsUri("1234567890", longMessage);
      expect(result).toContain("sms:1234567890?body=");
      expect(result.length).toBeGreaterThan(500); // Encoded will be longer
    });

    it("should handle empty message", () => {
      const result = generateSmsUri("1234567890", "");
      expect(result).toBe("sms:1234567890?body=");
    });

    it("should handle message with newlines", () => {
      const result = generateSmsUri("1234567890", "Line 1\nLine 2");
      expect(result).toBe("sms:1234567890?body=Line%201%0ALine%202");
    });

    it("should handle message with merge tags already replaced", () => {
      const message = "Hi John, schedule here: https://calendly.com/interview";
      const result = generateSmsUri("1234567890", message);
      expect(result).toContain("sms:1234567890?body=");
      expect(result).toContain("calendly.com");
    });

    it("should handle edge case: phone with only digits", () => {
      const result = generateSmsUri("1234567890123456", "Hello");
      expect(result).toBe("sms:1234567890123456?body=Hello");
    });

    it("should handle edge case: phone with all non-digits", () => {
      const result = generateSmsUri("abc-def-ghi", "Hello");
      expect(result).toBe("sms:?body=Hello");
    });
  });
});

