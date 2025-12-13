/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { openComposeAndroid, openComposeWebShare } from "@/lib/sms-compose";

// Note: window.location is not configurable in jsdom
// We test the function logic and return values
// Actual navigation behavior is tested in E2E tests

describe("sms-compose", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("openComposeAndroid", () => {
    it("should return SMS_URI method for valid phone number", async () => {
      const phoneE164 = "+15551234567";
      const message = "Test message";

      const result = await openComposeAndroid(phoneE164, message);

      expect(result.method).toBe("SMS_URI");
      expect(result.error).toBeUndefined();
    });

    it("should handle message encoding", async () => {
      const phoneE164 = "+15551234567";
      const message = "Hello & goodbye!";

      // Function should not throw and should return success
      const result = await openComposeAndroid(phoneE164, message);
      expect(result.method).toBe("SMS_URI");
    });

    it("should return FAILED if phone number is empty", async () => {
      const result = await openComposeAndroid("", "Test message");

      expect(result.method).toBe("FAILED");
      expect(result.error).toBe("Phone number is required");
    });

    it("should return FAILED if phone number is null", async () => {
      const result = await openComposeAndroid(null as any, "Test message");

      expect(result.method).toBe("FAILED");
      expect(result.error).toBe("Phone number is required");
    });

    it("should copy message to clipboard", async () => {
      const writeTextSpy = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextSpy,
        },
      });

      await openComposeAndroid("+15551234567", "Test message");

      expect(writeTextSpy).toHaveBeenCalledWith("Test message");
    });
  });

  describe("openComposeWebShare", () => {
    it("should use Web Share API when available", async () => {
      const shareSpy = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        share: shareSpy,
      });

      const result = await openComposeWebShare("Test message");

      expect(shareSpy).toHaveBeenCalledWith({
        text: "Test message",
      });
      expect(result.method).toBe("WEB_SHARE");
    });

    it("should return FAILED if Web Share API not supported", async () => {
      Object.assign(navigator, {
        share: undefined,
      });

      const result = await openComposeWebShare("Test message");

      expect(result.method).toBe("FAILED");
      expect(result.error).toBe("Web Share API not supported");
    });

    it("should return COPY_ONLY if user cancels share", async () => {
      const shareSpy = jest.fn().mockRejectedValue({
        name: "AbortError",
      });
      Object.assign(navigator, {
        share: shareSpy,
      });

      const result = await openComposeWebShare("Test message");

      expect(result.method).toBe("COPY_ONLY");
    });

    it("should return FAILED on other share errors", async () => {
      const shareSpy = jest.fn().mockRejectedValue(new Error("Share failed"));
      Object.assign(navigator, {
        share: shareSpy,
      });

      const result = await openComposeWebShare("Test message");

      expect(result.method).toBe("FAILED");
      expect(result.error).toBe("Share failed");
    });
  });
});
