/**
 * @jest-environment node
 */

import { describe, it, expect } from "@jest/globals";

describe("CSV Parsing Utilities", () => {
  describe("Phone Number Cleaning", () => {
    const cleanPhoneNumber = (value: string): string => {
      let cleaned = value.trim();
      // Remove leading apostrophes/quotes that can appear in phone numbers
      if (cleaned.startsWith("'") || cleaned.startsWith('"')) {
        cleaned = cleaned.slice(1);
      }
      // Remove trailing quotes
      if (cleaned.endsWith("'") || cleaned.endsWith('"')) {
        cleaned = cleaned.slice(0, -1);
      }
      return cleaned.trim();
    };

    it("should remove leading apostrophe from phone numbers", () => {
      expect(cleanPhoneNumber("'+1 570 394 2412")).toBe("+1 570 394 2412");
    });

    it("should remove leading double quote from phone numbers", () => {
      expect(cleanPhoneNumber('"+1 570 394 2412"')).toBe("+1 570 394 2412");
    });

    it("should remove both leading and trailing quotes", () => {
      expect(cleanPhoneNumber('"+1 570 394 2412"')).toBe("+1 570 394 2412");
      expect(cleanPhoneNumber("'+1 570 394 2412'")).toBe("+1 570 394 2412");
    });

    it("should not modify phone numbers without quotes", () => {
      expect(cleanPhoneNumber("+1 570 394 2412")).toBe("+1 570 394 2412");
      expect(cleanPhoneNumber("123-456-7890")).toBe("123-456-7890");
      expect(cleanPhoneNumber("(555) 123-4567")).toBe("(555) 123-4567");
    });

    it("should handle phone numbers with extra whitespace", () => {
      expect(cleanPhoneNumber("  '+1 570 394 2412'  ")).toBe("+1 570 394 2412");
    });
  });

  describe("BOM (Byte Order Mark) Removal", () => {
    const removeBOM = (header: string): string => {
      return header.replace(/^\uFEFF/, "").trim();
    };

    it("should remove BOM from header", () => {
      const bomHeader = "\uFEFFname";
      expect(removeBOM(bomHeader)).toBe("name");
    });

    it("should not modify headers without BOM", () => {
      expect(removeBOM("name")).toBe("name");
      expect(removeBOM("email")).toBe("email");
    });

    it("should handle headers with BOM and whitespace", () => {
      const bomHeader = "\uFEFF  name  ";
      expect(removeBOM(bomHeader)).toBe("name");
    });
  });

  describe("Column Name Normalization", () => {
    const normalizeHeader = (header: string): string => {
      return header.toLowerCase().replace(/[_\s-]/g, "");
    };

    it("should normalize column names for matching", () => {
      expect(normalizeHeader("Candidate Name")).toBe("candidatename");
      expect(normalizeHeader("candidate_location")).toBe("candidatelocation");
      expect(normalizeHeader("candidate-location")).toBe("candidatelocation");
      expect(normalizeHeader("Email Address")).toBe("emailaddress");
    });

    it("should handle case-insensitive matching", () => {
      expect(normalizeHeader("EMAIL")).toBe("email");
      expect(normalizeHeader("Email")).toBe("email");
      expect(normalizeHeader("email")).toBe("email");
    });
  });

  describe("Parsed Extra Column Filtering", () => {
    const filterHeaders = (headers: string[]): string[] => {
      return headers.filter(
        (header) =>
          header !== "__parsed_extra" &&
          header !== "_parsed_extra" &&
          header.trim() !== "" &&
          !header.startsWith("__")
      );
    };

    it("should filter out _parsed_extra columns", () => {
      const headers = ["name", "email", "phone", "_parsed_extra"];
      const filtered = filterHeaders(headers);
      expect(filtered).toEqual(["name", "email", "phone"]);
      expect(filtered).not.toContain("_parsed_extra");
    });

    it("should filter out __parsed_extra columns", () => {
      const headers = ["name", "email", "__parsed_extra"];
      const filtered = filterHeaders(headers);
      expect(filtered).toEqual(["name", "email"]);
      expect(filtered).not.toContain("__parsed_extra");
    });

    it("should filter out empty headers", () => {
      const headers = ["name", "", "email", "   "];
      const filtered = filterHeaders(headers);
      expect(filtered).toEqual(["name", "email"]);
    });

    it("should filter out headers starting with __", () => {
      const headers = ["name", "__private", "email"];
      const filtered = filterHeaders(headers);
      expect(filtered).toEqual(["name", "email"]);
    });

    it("should preserve valid headers", () => {
      const headers = ["name", "email", "phone", "candidate location"];
      const filtered = filterHeaders(headers);
      expect(filtered).toEqual(headers);
    });
  });

  describe("Data Cleaning", () => {
    const cleanRowData = (
      row: Record<string, any>,
      validHeaders: string[]
    ): Record<string, string> => {
      const cleaned: Record<string, string> = {};
      validHeaders.forEach((header) => {
        cleaned[header] = row[header] || "";
      });
      return cleaned;
    };

    it("should remove _parsed_extra from row data", () => {
      const row = {
        name: "John Doe",
        email: "john@test.com",
        _parsed_extra: ["extra", "data"],
      };
      const validHeaders = ["name", "email"];
      const cleaned = cleanRowData(row, validHeaders);

      expect(cleaned).not.toHaveProperty("_parsed_extra");
      expect(cleaned).toHaveProperty("name", "John Doe");
      expect(cleaned).toHaveProperty("email", "john@test.com");
    });

    it("should handle missing values", () => {
      const row = {
        name: "John Doe",
        email: "",
        phone: "1234567890",
      };
      const validHeaders = ["name", "email", "phone"];
      const cleaned = cleanRowData(row, validHeaders);

      expect(cleaned.email).toBe("");
      expect(cleaned.name).toBe("John Doe");
      expect(cleaned.phone).toBe("1234567890");
    });
  });
});
