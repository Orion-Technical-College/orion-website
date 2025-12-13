/**
 * @jest-environment node
 */

import { validatePassword } from "@/lib/password-validation";

describe("password-validation", () => {
  describe("validatePassword", () => {
    it("should accept valid password", () => {
      const result = validatePassword("ValidPass123!");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject password shorter than 8 characters", () => {
      const result = validatePassword("Short1!");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Password must be at least 8 characters");
    });

    it("should reject password without uppercase letter", () => {
      const result = validatePassword("lowercase123!");
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        "Password must contain at least one uppercase letter"
      );
    });

    it("should reject password without lowercase letter", () => {
      const result = validatePassword("UPPERCASE123!");
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        "Password must contain at least one lowercase letter"
      );
    });

    it("should reject password without number", () => {
      const result = validatePassword("NoNumber!");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Password must contain at least one number");
    });

    it("should reject password without special character", () => {
      const result = validatePassword("NoSpecial123");
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        "Password must contain at least one special character"
      );
    });

    it("should accept password with all requirements", () => {
      const validPasswords = [
        "Password123!",
        "MyP@ssw0rd",
        "Test#1234",
        "Complex$Pass1",
        "Valid!Pass2",
      ];

      validPasswords.forEach((password) => {
        const result = validatePassword(password);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it("should reject empty password", () => {
      const result = validatePassword("");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Password must be at least 8 characters");
    });

    it("should handle edge cases", () => {
      // Exactly 8 characters with all requirements
      const result1 = validatePassword("Pass123!");
      expect(result1.valid).toBe(true);

      // 7 characters (too short)
      const result2 = validatePassword("Pass12!");
      expect(result2.valid).toBe(false);

      // Very long password
      const result3 = validatePassword(
        "VeryLongPasswordWithAllRequirements123!"
      );
      expect(result3.valid).toBe(true);
    });

    it("should accept various special characters", () => {
      const specialChars = ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")"];
      specialChars.forEach((char) => {
        const password = `Password123${char}`;
        const result = validatePassword(password);
        expect(result.valid).toBe(true);
      });
    });
  });
});

