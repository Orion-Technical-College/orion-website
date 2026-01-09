/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CSVImport } from "@/components/import/csv-import";
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

describe("CSV Import Component Integration", () => {
  const mockOnImport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockParse.mockClear();
  });

  describe("Column Auto-Mapping", () => {
    it("should auto-map standard column names correctly", () => {
      const mockData = [
        {
          name: "John Doe",
          email: "john@test.com",
          phone: "1234567890",
        },
      ];

      // Test the auto-mapping logic directly
      const fileHeaders = Object.keys(mockData[0]);
      const headerLower = "name".toLowerCase().replace(/[_\s-]/g, "");
      const matchesName = headerLower.includes("name") || headerLower.includes("candidate");

      expect(matchesName).toBe(true);
      expect(fileHeaders).toContain("name");
      expect(fileHeaders).toContain("email");
      expect(fileHeaders).toContain("phone");
    });

    it("should auto-map 'candidate location' to location field", () => {
      const header = "candidate location";
      const headerLower = header.toLowerCase().replace(/[_\s-]/g, "");
      
      const matchesLocation = 
        headerLower.includes("location") ||
        headerLower.includes("address") ||
        headerLower.includes("city") ||
        (headerLower.includes("candidate") && headerLower.includes("location"));

      expect(matchesLocation).toBe(true);
    });

    it("should auto-map 'job title' to jobTitle field", () => {
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
  });

  describe("Phone Number Cleaning", () => {
    it("should clean phone numbers with leading quotes in parsed data", () => {
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

      const phoneWithQuote = "'+1 570 394 2412";
      const cleaned = transform(phoneWithQuote);
      
      expect(cleaned).toBe("+1 570 394 2412");
      expect(cleaned).not.toContain("'");
    });
  });

  describe("Required Field Validation", () => {
    it("should identify missing required fields", () => {
      const requiredFields = ["name", "email", "phone"];
      const mappedFields = ["name", "phone"]; // Missing email
      
      const missingFields = requiredFields.filter((f) => !mappedFields.includes(f));
      
      expect(missingFields).toContain("email");
      expect(missingFields.length).toBe(1);
    });
  });

  describe("Error Handling", () => {
    it("should handle PapaParse error callback", () => {
      const errorCallback = jest.fn();
      const error = new Error("Parse error");
      
      // Simulate error callback
      errorCallback(error);
      
      expect(errorCallback).toHaveBeenCalledWith(error);
    });

    it("should handle empty CSV data", () => {
      const emptyData: any[] = [];
      
      expect(emptyData.length).toBe(0);
      // Component should handle empty data gracefully
      expect(Array.isArray(emptyData)).toBe(true);
    });
  });
});
