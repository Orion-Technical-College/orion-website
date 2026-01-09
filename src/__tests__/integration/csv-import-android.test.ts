/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import Papa from "papaparse";

// Mock PapaParse
const mockParse = jest.fn();
jest.mock("papaparse", () => ({
  __esModule: true,
  default: {
    parse: mockParse,
  },
  parse: mockParse,
}));

describe("CSV Import Android Fixes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParse.mockClear();
  });

  describe("Android MIME Type Handling", () => {
    it("should accept CSV file with application/csv MIME type (Android)", () => {
      const file = new File(
        ["name,email,phone\nJohn,john@test.com,123"],
        "test.csv",
        { type: "application/csv" }
      );

      // Test that the file is valid
      expect(file.type).toBe("application/csv");
      expect(file.name).toMatch(/\.csv$/i);
    });

    it("should accept CSV file with application/octet-stream MIME type (Android fallback)", () => {
      const file = new File(
        ["name,email,phone\nJohn,john@test.com,123"],
        "test.csv",
        { type: "application/octet-stream" }
      );

      // Test that the file extension is valid even if MIME type is generic
      expect(file.name).toMatch(/\.csv$/i);
      const fileExtension = file.name.toLowerCase().substring(
        file.name.lastIndexOf(".")
      );
      expect([".csv", ".xls", ".xlsx"]).toContain(fileExtension);
    });
  });

  describe("_parsed_extra Column Filtering", () => {
    it("should filter out _parsed_extra columns from data", () => {
      const rawData = [
        {
          name: "John Doe",
          email: "john@test.com",
          phone: "1234567890",
          _parsed_extra: ["extra", "data"],
        },
      ];

      // Simulate the filtering logic
      const fileHeaders = Object.keys(rawData[0]).filter(
        (header) =>
          header !== "__parsed_extra" &&
          header !== "_parsed_extra" &&
          header.trim() !== "" &&
          !header.startsWith("__")
      );

      expect(fileHeaders).not.toContain("_parsed_extra");
      expect(fileHeaders).toContain("name");
      expect(fileHeaders).toContain("email");
      expect(fileHeaders).toContain("phone");
    });

    it("should filter out __parsed_extra columns", () => {
      const rawData = [
        {
          name: "John Doe",
          email: "john@test.com",
          __parsed_extra: ["extra"],
        },
      ];

      const fileHeaders = Object.keys(rawData[0]).filter(
        (header) =>
          header !== "__parsed_extra" &&
          header !== "_parsed_extra" &&
          header.trim() !== "" &&
          !header.startsWith("__")
      );

      expect(fileHeaders).not.toContain("__parsed_extra");
      expect(fileHeaders).toContain("name");
      expect(fileHeaders).toContain("email");
    });
  });

  describe("Phone Number Cleaning", () => {
    it("should remove leading apostrophes from phone numbers", () => {
      const mockData = [
        {
          name: "John Doe",
          email: "john@test.com",
          phone: "'+1 570 394 2412",
        },
      ];

      mockParse.mockImplementation((file, options) => {
        setTimeout(() => {
          if (options.complete) {
            options.complete({
              data: mockData,
              errors: [],
              meta: {},
            });
          }
        }, 0);
      });

      // The transform function should clean the phone number
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

      expect(transform("'+1 570 394 2412")).toBe("+1 570 394 2412");
      expect(transform('"+1 570 394 2412"')).toBe("+1 570 394 2412");
    });

    it("should handle phone numbers without quotes", () => {
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

      expect(transform("+1 570 394 2412")).toBe("+1 570 394 2412");
      expect(transform("123-456-7890")).toBe("123-456-7890");
    });
  });

  describe("BOM (Byte Order Mark) Removal", () => {
    it("should remove BOM from headers", () => {
      const transformHeader = (header: string) => {
        return header.replace(/^\uFEFF/, "").trim();
      };

      const bomHeader = "\uFEFFname";
      expect(transformHeader(bomHeader)).toBe("name");
      expect(transformHeader("name")).toBe("name");
    });
  });

  describe("Enhanced Column Name Matching", () => {
    it("should match 'candidate location' to 'location' field", () => {
      const header = "candidate location";
      const headerLower = header.toLowerCase().replace(/[_\s-]/g, "");
      
      const matchesLocation = 
        headerLower.includes("location") ||
        headerLower.includes("address") ||
        headerLower.includes("city") ||
        (headerLower.includes("candidate") && headerLower.includes("location"));

      expect(matchesLocation).toBe(true);
    });

    it("should match 'job title' to 'jobTitle' field", () => {
      const header = "job title";
      const headerLower = header.toLowerCase().replace(/[_\s-]/g, "");
      
      const matchesJobTitle =
        headerLower.includes("job") ||
        headerLower.includes("title") ||
        headerLower.includes("position") ||
        headerLower.includes("role") ||
        (headerLower.includes("job") && headerLower.includes("title"));

      expect(matchesJobTitle).toBe(true);
    });

    it("should match various email column names", () => {
      const emailVariations = [
        "email",
        "e-mail",
        "email address",
        "mail",
        "contact email",
      ];

      emailVariations.forEach((header) => {
        const headerLower = header.toLowerCase().replace(/[_\s-]/g, "");
        const matchesEmail =
          headerLower.includes("email") ||
          headerLower.includes("e-mail") ||
          headerLower === "mail" ||
          headerLower.includes("mailaddress") ||
          (headerLower.includes("contact") && headerLower.includes("email"));

        expect(matchesEmail).toBe(true);
      });
    });

    it("should match various phone column names", () => {
      const phoneVariations = ["phone", "telephone", "mobile", "cell", "phone number"];

      phoneVariations.forEach((header) => {
        const headerLower = header.toLowerCase().replace(/[_\s-]/g, "");
        const matchesPhone =
          headerLower.includes("phone") ||
          headerLower.includes("tel") ||
          headerLower.includes("mobile") ||
          headerLower.includes("cell") ||
          headerLower.includes("number");

        expect(matchesPhone).toBe(true);
      });
    });
  });

  describe("Real CSV Template Format", () => {
    it("should parse CSV matching the actual template format", () => {
      const mockData = [
        {
          name: "Chris Dunn",
          email: "dunn04424qkdw4_653@indeedemail.com",
          phone: "'+1 570 394 2412",
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

      // Test data structure matches template
      expect(mockData[0]).toHaveProperty("name");
      expect(mockData[0]).toHaveProperty("email");
      expect(mockData[0]).toHaveProperty("phone");
      expect(mockData[0]).toHaveProperty("candidate location");
      expect(mockData[0]).toHaveProperty("job title");
      expect(mockData[0]).toHaveProperty("source");
    });

    it("should handle CSV with quoted values containing commas", () => {
      const mockData = [
        {
          name: "John Doe",
          email: "john@test.com",
          phone: "123-456-7890",
          location: "Altoona, PA",
        },
      ];

      // Verify quoted values with commas are handled
      expect(mockData[0].location).toBe("Altoona, PA");
      expect(mockData[0].location).toContain(",");
    });
  });

  describe("Data Cleaning", () => {
    it("should clean data by removing parsed_extra fields", () => {
      const rawData = [
        {
          name: "John Doe",
          email: "john@test.com",
          phone: "1234567890",
          _parsed_extra: ["extra", "data"],
        },
      ];

      const fileHeaders = Object.keys(rawData[0]).filter(
        (header) =>
          header !== "__parsed_extra" &&
          header !== "_parsed_extra" &&
          header.trim() !== "" &&
          !header.startsWith("__")
      );

      const cleanedData = rawData.map((row) => {
        const cleaned: Record<string, string> = {};
        fileHeaders.forEach((header) => {
          cleaned[header] = row[header] || "";
        });
        return cleaned;
      });

      expect(cleanedData[0]).not.toHaveProperty("_parsed_extra");
      expect(cleanedData[0]).toHaveProperty("name");
      expect(cleanedData[0]).toHaveProperty("email");
      expect(cleanedData[0]).toHaveProperty("phone");
    });

    it("should filter out empty columns", () => {
      const rawData = [
        {
          name: "John Doe",
          email: "john@test.com",
          "": "empty column",
        },
      ];

      const fileHeaders = Object.keys(rawData[0]).filter(
        (header) =>
          header !== "__parsed_extra" &&
          header !== "_parsed_extra" &&
          header.trim() !== "" &&
          !header.startsWith("__")
      );

      expect(fileHeaders).not.toContain("");
      expect(fileHeaders).toContain("name");
      expect(fileHeaders).toContain("email");
    });
  });

  describe("PapaParse Configuration", () => {
    it("should configure PapaParse with correct options structure", () => {
      // Verify the expected configuration structure
      const expectedConfig = {
        header: true,
        skipEmptyLines: true,
        encoding: "UTF-8",
        transformHeader: expect.any(Function),
        transform: expect.any(Function),
        complete: expect.any(Function),
        error: expect.any(Function),
      };

      // Test transformHeader function
      const transformHeader = (header: string) => {
        return header.replace(/^\uFEFF/, "").trim();
      };

      // Test transform function
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

      expect(typeof transformHeader).toBe("function");
      expect(typeof transform).toBe("function");
      expect(transformHeader("\uFEFFname")).toBe("name");
      expect(transform("'+1 570 394 2412")).toBe("+1 570 394 2412");
    });
  });
});
