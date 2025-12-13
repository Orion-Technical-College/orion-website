/**
 * @jest-environment node
 */

import { checkRateLimit, clearRateLimit, RateLimitResult } from "@/lib/rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    // Clear all rate limits before each test
    clearRateLimit("test-key-1");
    clearRateLimit("test-key-2");
    clearRateLimit("test-email:test@example.com");
    clearRateLimit("test-ip:127.0.0.1");
  });

  describe("checkRateLimit", () => {
    it("should allow first request", () => {
      const result = checkRateLimit("test-key-1", 5, 15 * 60 * 1000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });

    it("should allow requests within limit", () => {
      for (let i = 0; i < 4; i++) {
        const result = checkRateLimit("test-key-1", 5, 15 * 60 * 1000);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });

    it("should block requests exceeding limit", () => {
      // Make 5 requests (limit is 5)
      for (let i = 0; i < 5; i++) {
        checkRateLimit("test-key-1", 5, 15 * 60 * 1000);
      }

      // 6th request should be blocked
      const result = checkRateLimit("test-key-1", 5, 15 * 60 * 1000);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should reset after window expires", (done) => {
      const shortWindow = 100; // 100ms window for testing
      checkRateLimit("test-key-1", 5, shortWindow);

      // Wait for window to expire
      setTimeout(() => {
        const result = checkRateLimit("test-key-1", 5, shortWindow);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4);
        done();
      }, shortWindow + 10);
    });

    it("should handle different keys independently", () => {
      // Use up limit for key 1
      for (let i = 0; i < 5; i++) {
        checkRateLimit("test-key-1", 5, 15 * 60 * 1000);
      }

      // Key 2 should still be allowed
      const result = checkRateLimit("test-key-2", 5, 15 * 60 * 1000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("should correctly track remaining attempts", () => {
      const result1 = checkRateLimit("test-key-1", 5, 15 * 60 * 1000);
      expect(result1.remaining).toBe(4);

      const result2 = checkRateLimit("test-key-1", 5, 15 * 60 * 1000);
      expect(result2.remaining).toBe(3);

      const result3 = checkRateLimit("test-key-1", 5, 15 * 60 * 1000);
      expect(result3.remaining).toBe(2);
    });
  });

  describe("clearRateLimit", () => {
    it("should clear rate limit for a key", () => {
      // Use up limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit("test-key-1", 5, 15 * 60 * 1000);
      }

      // Should be blocked
      let result = checkRateLimit("test-key-1", 5, 15 * 60 * 1000);
      expect(result.allowed).toBe(false);

      // Clear limit
      clearRateLimit("test-key-1");

      // Should be allowed again
      result = checkRateLimit("test-key-1", 5, 15 * 60 * 1000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("should not affect other keys when clearing", () => {
      // Use up limit for key 1
      for (let i = 0; i < 5; i++) {
        checkRateLimit("test-key-1", 5, 15 * 60 * 1000);
      }

      // Use up limit for key 2
      for (let i = 0; i < 5; i++) {
        checkRateLimit("test-key-2", 5, 15 * 60 * 1000);
      }

      // Clear key 1
      clearRateLimit("test-key-1");

      // Key 1 should be allowed
      let result1 = checkRateLimit("test-key-1", 5, 15 * 60 * 1000);
      expect(result1.allowed).toBe(true);

      // Key 2 should still be blocked
      let result2 = checkRateLimit("test-key-2", 5, 15 * 60 * 1000);
      expect(result2.allowed).toBe(false);
    });
  });

  describe("key correctness", () => {
    it("should key rate limits correctly by email", () => {
      const email1 = "test-email:user1@example.com";
      const email2 = "test-email:user2@example.com";

      // Use up limit for email1
      for (let i = 0; i < 5; i++) {
        checkRateLimit(email1, 5, 15 * 60 * 1000);
      }

      // email1 should be blocked
      let result = checkRateLimit(email1, 5, 15 * 60 * 1000);
      expect(result.allowed).toBe(false);

      // email2 should still be allowed
      result = checkRateLimit(email2, 5, 15 * 60 * 1000);
      expect(result.allowed).toBe(true);
    });

    it("should key rate limits correctly by IP", () => {
      const ip1 = "test-ip:127.0.0.1";
      const ip2 = "test-ip:192.168.1.1";

      // Use up limit for ip1
      for (let i = 0; i < 10; i++) {
        checkRateLimit(ip1, 10, 15 * 60 * 1000);
      }

      // ip1 should be blocked
      let result = checkRateLimit(ip1, 10, 15 * 60 * 1000);
      expect(result.allowed).toBe(false);

      // ip2 should still be allowed
      result = checkRateLimit(ip2, 10, 15 * 60 * 1000);
      expect(result.allowed).toBe(true);
    });
  });

  describe("concurrent requests", () => {
    it("should handle concurrent requests correctly", async () => {
      const key = "test-concurrent";
      const promises = Array.from({ length: 10 }, () =>
        Promise.resolve(checkRateLimit(key, 5, 15 * 60 * 1000))
      );

      const results = await Promise.all(promises);
      const allowedCount = results.filter((r) => r.allowed).length;
      const blockedCount = results.filter((r) => !r.allowed).length;

      // Should allow 5 and block 5
      expect(allowedCount).toBe(5);
      expect(blockedCount).toBe(5);
    });
  });

  describe("failure handling", () => {
    it("should handle invalid parameters gracefully", () => {
      // Test with 0 maxAttempts (edge case)
      const result = checkRateLimit("test-key", 0, 15 * 60 * 1000);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should handle negative windowMs", () => {
      // Test with negative window (edge case)
      const result = checkRateLimit("test-key", 5, -1000);
      expect(result.allowed).toBe(true);
      // Reset time should be in the past, so next request will reset
    });
  });
});

