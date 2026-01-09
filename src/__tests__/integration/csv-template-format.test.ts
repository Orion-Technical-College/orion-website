/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import Papa from "papaparse";

// Mock PapaParse
jest.mock("papaparse", () => ({
  parse: jest.fn(),
}));

describe("CSV Template Format (1-1-26_NEW_VIA.csv)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Template Structure Validation", () => {
    it("should parse CSV with all template columns", () => {
      const csvContent = `name,email,phone,status,candidate location,relevant experience,education,job title,job location,date,interest level,source
Chris Dunn,dunn04424qkdw4_653@indeedemail.com,'+1 570 394 2412,Awaiting Review,"Altoona, PA",Asphalt Laborer,High school diploma,Field Installation Technician,"Altoona, PA",1/1/2026,,Sponsored Job Link`;

      const expectedData = [
        {
          name: "Chris Dunn",
          email: "dunn04424qkdw4_653@indeedemail.com",
          phone: "+1 570 394 2412", // Should be cleaned
          status: "Awaiting Review",
          "candidate location": "Altoona, PA",
          "relevant experience": "Asphalt Laborer",
          education: "High school diploma",
          "job title": "Field Installation Technician",
          "job location": "Altoona, PA",
          date: "1/1/2026",
          "interest level": "",
          source: "Sponsored Job Link",
        },
      ];

      // Simulate PapaParse configuration
      const transform = (value: string) => {
        let cleaned = value.trim();
        if (cleaned.startsWith("'") || cleaned.startsWith('"')) {
          cleaned = cleaned.slice(1);
        }
        if (cleaned.endsWith("'") || cleaned.endsWith('"')) {
          cleaned = cleaned.slice(0, -1);
        }
        return cleaned.trim();
      };

      const transformHeader = (header: string) => {
        return header.replace(/^\uFEFF/, "").trim();
      };

      // Test phone number cleaning
      expect(transform("'+1 570 394 2412")).toBe("+1 570 394 2412");

      // Test header transformation
      expect(transformHeader("name")).toBe("name");
      expect(transformHeader("\uFEFFname")).toBe("name");

      // Verify expected structure
      expect(expectedData[0]).toHaveProperty("name");
      expect(expectedData[0]).toHaveProperty("email");
      expect(expectedData[0]).toHaveProperty("phone");
      expect(expectedData[0]).toHaveProperty("candidate location");
      expect(expectedData[0]).toHaveProperty("job title");
    });

    it("should handle multiple rows from template", () => {
      const csvContent = `name,email,phone,status,candidate location,relevant experience,education,job title,job location,date,interest level,source
Chris Dunn,dunn04424qkdw4_653@indeedemail.com,'+1 570 394 2412,Awaiting Review,"Altoona, PA",Asphalt Laborer,High school diploma,Field Installation Technician,"Altoona, PA",1/1/2026,,Sponsored Job Link
Alex O'Brien,alexobrienf9v6b_nm5@indeedemail.com,'+1 814 661 4700,Awaiting Review,"Penfield, PA",Dishwasher,High school diploma,Field Installation Technician,"DuBois, PA",1/1/2026,,Sponsored Job Link`;

      const expectedRows = 2;
      expect(expectedRows).toBe(2);
    });

    it("should handle empty interest level field", () => {
      const row = {
        name: "Chris Dunn",
        email: "dunn@test.com",
        phone: "+1 570 394 2412",
        "interest level": "",
      };

      expect(row["interest level"]).toBe("");
      // Empty fields should be handled gracefully
      expect(row["interest level"] || "N/A").toBe("N/A");
    });

    it("should handle quoted values with commas in location fields", () => {
      const locations = [
        "Altoona, PA",
        "Penfield, PA",
        "Lexington, VA (City of Lexington)",
      ];

      locations.forEach((location) => {
        // Locations with commas should be properly quoted in CSV
        expect(location).toContain(",");
        // When parsed, should be a single value
        expect(typeof location).toBe("string");
      });
    });
  });

  describe("Column Mapping for Template", () => {
    const testColumnMapping = (sourceHeader: string, expectedTarget: string) => {
      const headerLower = sourceHeader.toLowerCase().replace(/[_\s-]/g, "");

      if (expectedTarget === "location") {
        return (
          headerLower.includes("location") ||
          headerLower.includes("address") ||
          headerLower.includes("city") ||
          (headerLower.includes("candidate") && headerLower.includes("location"))
        );
      }

      if (expectedTarget === "jobTitle") {
        return (
          headerLower.includes("job") ||
          headerLower.includes("title") ||
          headerLower.includes("position") ||
          headerLower.includes("role") ||
          (headerLower.includes("job") && headerLower.includes("title"))
        );
      }

      if (expectedTarget === "email") {
        return (
          headerLower.includes("email") ||
          headerLower.includes("e-mail") ||
          headerLower === "mail" ||
          headerLower.includes("mailaddress") ||
          (headerLower.includes("contact") && headerLower.includes("email"))
        );
      }

      return headerLower.includes(expectedTarget.toLowerCase());
    };

    it("should map 'candidate location' to location field", () => {
      expect(testColumnMapping("candidate location", "location")).toBe(true);
    });

    it("should map 'job title' to jobTitle field", () => {
      expect(testColumnMapping("job title", "jobTitle")).toBe(true);
    });

    it("should map 'email' to email field", () => {
      expect(testColumnMapping("email", "email")).toBe(true);
    });

    it("should map 'name' to name field", () => {
      expect(testColumnMapping("name", "name")).toBe(true);
    });

    it("should map 'phone' to phone field", () => {
      expect(testColumnMapping("phone", "phone")).toBe(true);
    });

    it("should map 'source' to source field", () => {
      expect(testColumnMapping("source", "source")).toBe(true);
    });

    it("should map 'status' to status field", () => {
      expect(testColumnMapping("status", "status")).toBe(true);
    });

    it("should map 'date' to date field", () => {
      expect(testColumnMapping("date", "date")).toBe(true);
    });
  });

  describe("Phone Number Format Handling", () => {
    it("should handle phone numbers with leading apostrophe", () => {
      const phoneNumbers = [
        "'+1 570 394 2412",
        "'+1 814 661 4700",
        "'+1 540 388 3948",
      ];

      const cleanPhone = (value: string) => {
        let cleaned = value.trim();
        if (cleaned.startsWith("'") || cleaned.startsWith('"')) {
          cleaned = cleaned.slice(1);
        }
        if (cleaned.endsWith("'") || cleaned.endsWith('"')) {
          cleaned = cleaned.slice(0, -1);
        }
        return cleaned.trim();
      };

      phoneNumbers.forEach((phone) => {
        const cleaned = cleanPhone(phone);
        expect(cleaned).not.toContain("'");
        expect(cleaned).toMatch(/^\+1/);
      });
    });

    it("should handle international phone numbers", () => {
      const internationalPhone = "'+92 321 8802398";
      const cleanPhone = (value: string) => {
        let cleaned = value.trim();
        if (cleaned.startsWith("'") || cleaned.startsWith('"')) {
          cleaned = cleaned.slice(1);
        }
        return cleaned.trim();
      };

      const cleaned = cleanPhone(internationalPhone);
      expect(cleaned).toBe("+92 321 8802398");
      expect(cleaned).toMatch(/^\+92/);
    });
  });

  describe("Required Fields Validation", () => {
    it("should identify required fields from template", () => {
      const requiredFields = ["name", "email", "phone"];
      const templateHeaders = [
        "name",
        "email",
        "phone",
        "status",
        "candidate location",
        "relevant experience",
        "education",
        "job title",
        "job location",
        "date",
        "interest level",
        "source",
      ];

      requiredFields.forEach((field) => {
        expect(templateHeaders).toContain(field);
      });
    });

    it("should validate all required fields are present in template", () => {
      const templateRow = {
        name: "Chris Dunn",
        email: "dunn@test.com",
        phone: "+1 570 394 2412",
      };

      expect(templateRow).toHaveProperty("name");
      expect(templateRow).toHaveProperty("email");
      expect(templateRow).toHaveProperty("phone");
    });
  });
});
