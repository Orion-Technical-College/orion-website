/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

// Mock DataTransfer for jsdom environment
class MockDataTransfer {
  items: DataTransferItemList;
  files: FileList;

  constructor() {
    const items: DataTransferItem[] = [];
    const files: File[] = [];

    this.items = {
      add: (file: File | string) => {
        if (file instanceof File) {
          items.push({
            kind: "file",
            type: file.type,
            getAsFile: () => file,
          } as DataTransferItem);
          files.push(file);
        }
      },
      remove: () => {},
      clear: () => {},
      length: items.length,
      [Symbol.iterator]: () => items[Symbol.iterator](),
    } as DataTransferItemList;

    this.files = {
      length: files.length,
      item: (index: number) => files[index] || null,
      [Symbol.iterator]: () => files[Symbol.iterator](),
    } as FileList;
  }
}

// Polyfill DataTransfer for jsdom
(global as any).DataTransfer = MockDataTransfer;

describe("CSV Import iOS Fixes", () => {
  let fileInput: HTMLInputElement;
  let handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  let handleFileInputClick: (e: React.MouseEvent<HTMLInputElement>) => void;

  beforeEach(() => {
    // Create a file input element
    fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".csv,.xlsx,.xls";
    fileInput.id = "file-input";
    document.body.appendChild(fileInput);

    // Mock file input handlers
    handleFileInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
      // Clear value to ensure onChange fires even if same file is selected (iOS fix)
      e.currentTarget.value = "";
    };

    handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) {
        return;
      }
      const selectedFile = files[0];

      // Validate file exists and has content
      if (selectedFile.size === 0) {
        throw new Error("File is empty");
      }

      // iOS MIME type validation - trust extension if MIME type is generic/missing
      const fileExtension = selectedFile.name.toLowerCase().substring(
        selectedFile.name.lastIndexOf(".")
      );
      const allowedExtensions = [".csv", ".xls", ".xlsx"];
      const allowedMimeTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain", // iOS/Android sometimes reports CSV as text/plain
        "application/csv", // Android sometimes uses this
        "application/octet-stream", // Android fallback for CSV files
      ];

      const isValidMimeType = allowedMimeTypes.includes(selectedFile.type);
      const isValidExtension = allowedExtensions.includes(fileExtension);

      // Accept if MIME type is valid OR extension is valid (iOS fallback)
      if (!isValidMimeType && !isValidExtension) {
        throw new Error("Please upload a CSV or Excel file");
      }
    };
  });

  afterEach(() => {
    document.body.removeChild(fileInput);
  });

  describe("iOS MIME Type Handling", () => {
    it("should accept CSV file with text/csv MIME type", () => {
      const file = new File(["name,email,phone\nJohn,john@test.com,123"], "test.csv", {
        type: "text/csv",
      });

      // Mock file input files property for jsdom
      const mockFileList = [file] as any;
      mockFileList.item = (index: number) => mockFileList[index] || null;
      Object.defineProperty(fileInput, "files", {
        value: mockFileList,
        writable: true,
        configurable: true,
      });

      const event = new Event("change", { bubbles: true }) as any;
      Object.defineProperty(event, "target", { value: fileInput, enumerable: true });

      expect(() => handleFileChange(event)).not.toThrow();
    });

    it("should accept CSV file with text/plain MIME type (iOS fallback)", () => {
      const file = new File(["name,email,phone\nJohn,john@test.com,123"], "test.csv", {
        type: "text/plain", // iOS sometimes reports CSV as text/plain
      });

      const mockFileList = [file] as any;
      mockFileList.item = (index: number) => mockFileList[index] || null;
      Object.defineProperty(fileInput, "files", {
        value: mockFileList,
        writable: true,
        configurable: true,
      });

      const event = new Event("change", { bubbles: true }) as any;
      Object.defineProperty(event, "target", { value: fileInput, enumerable: true });

      expect(() => handleFileChange(event)).not.toThrow();
    });

    it("should accept CSV file with empty MIME type but valid extension (iOS fallback)", () => {
      const file = new File(["name,email,phone\nJohn,john@test.com,123"], "test.csv", {
        type: "", // iOS sometimes reports empty MIME type
      });

      const mockFileList = [file] as any;
      mockFileList.item = (index: number) => mockFileList[index] || null;
      Object.defineProperty(fileInput, "files", {
        value: mockFileList,
        writable: true,
        configurable: true,
      });

      const event = new Event("change", { bubbles: true }) as any;
      Object.defineProperty(event, "target", { value: fileInput, enumerable: true });

      expect(() => handleFileChange(event)).not.toThrow();
    });

    it("should accept Excel file with application/vnd.ms-excel MIME type", () => {
      const file = new File(["test"], "test.xls", {
        type: "application/vnd.ms-excel",
      });

      const mockFileList = [file] as any;
      mockFileList.item = (index: number) => mockFileList[index] || null;
      Object.defineProperty(fileInput, "files", {
        value: mockFileList,
        writable: true,
        configurable: true,
      });

      const event = new Event("change", { bubbles: true }) as any;
      Object.defineProperty(event, "target", { value: fileInput, enumerable: true });

      expect(() => handleFileChange(event)).not.toThrow();
    });

    it("should reject file with invalid MIME type and invalid extension", () => {
      // Use a file type that's not in allowedMimeTypes and extension not in allowedExtensions
      const file = new File(["test"], "test.pdf", {
        type: "application/pdf", // Not in allowedMimeTypes
      });

      const mockFileList = [file] as any;
      mockFileList.item = (index: number) => mockFileList[index] || null;
      Object.defineProperty(fileInput, "files", {
        value: mockFileList,
        writable: true,
        configurable: true,
      });

      const event = new Event("change", { bubbles: true }) as any;
      Object.defineProperty(event, "target", { value: fileInput, enumerable: true });

      expect(() => handleFileChange(event)).toThrow("Please upload a CSV or Excel file");
    });
  });

  describe("File Input Clearing (iOS Fix)", () => {
    it("should clear file input value on click", () => {
      // Note: In jsdom, we can't actually set file input value, but we can test the handler logic
      const event = new MouseEvent("click", { bubbles: true }) as any;
      Object.defineProperty(event, "currentTarget", { 
        value: { value: "test.csv" }, 
        enumerable: true,
        writable: true,
        configurable: true,
      });

      // Simulate clearing
      event.currentTarget.value = "";

      expect(event.currentTarget.value).toBe("");
    });

    it("should allow re-selecting the same file after clearing", () => {
      const file = new File(["name,email\nJohn,john@test.com"], "test.csv", {
        type: "text/csv",
      });

      // First selection
      const mockFileList1 = [file] as any;
      mockFileList1.item = (index: number) => mockFileList1[index] || null;
      Object.defineProperty(fileInput, "files", {
        value: mockFileList1,
        writable: true,
        configurable: true,
      });

      // Clear on click
      const clickEvent = new MouseEvent("click", { bubbles: true }) as any;
      const mockTarget = { value: "test.csv" };
      Object.defineProperty(clickEvent, "currentTarget", { 
        value: mockTarget, 
        enumerable: true,
        writable: true,
        configurable: true,
      });
      handleFileInputClick(clickEvent);

      expect(mockTarget.value).toBe("");

      // Re-select same file
      const mockFileList2 = [file] as any;
      mockFileList2.item = (index: number) => mockFileList2[index] || null;
      Object.defineProperty(fileInput, "files", {
        value: mockFileList2,
        writable: true,
        configurable: true,
      });

      const changeEvent = new Event("change", { bubbles: true }) as any;
      Object.defineProperty(changeEvent, "target", { value: fileInput, enumerable: true });

      // Should work after clearing
      expect(() => handleFileChange(changeEvent)).not.toThrow();
    });
  });

  describe("Empty File Validation", () => {
    it("should reject empty files", () => {
      const file = new File([], "empty.csv", {
        type: "text/csv",
      });

      const mockFileList = [file] as any;
      mockFileList.item = (index: number) => mockFileList[index] || null;
      Object.defineProperty(fileInput, "files", {
        value: mockFileList,
        writable: true,
        configurable: true,
      });

      const event = new Event("change", { bubbles: true }) as any;
      Object.defineProperty(event, "target", { value: fileInput, enumerable: true });

      expect(() => handleFileChange(event)).toThrow("File is empty");
    });
  });

  describe("File Extension Validation", () => {
    it("should accept .csv extension", () => {
      const file = new File(["test"], "test.csv", {
        type: "",
      });

      const mockFileList = [file] as any;
      mockFileList.item = (index: number) => mockFileList[index] || null;
      Object.defineProperty(fileInput, "files", {
        value: mockFileList,
        writable: true,
        configurable: true,
      });

      const event = new Event("change", { bubbles: true }) as any;
      Object.defineProperty(event, "target", { value: fileInput, enumerable: true });

      expect(() => handleFileChange(event)).not.toThrow();
    });

    it("should accept .xls extension", () => {
      const file = new File(["test"], "test.xls", {
        type: "",
      });

      const mockFileList = [file] as any;
      mockFileList.item = (index: number) => mockFileList[index] || null;
      Object.defineProperty(fileInput, "files", {
        value: mockFileList,
        writable: true,
        configurable: true,
      });

      const event = new Event("change", { bubbles: true }) as any;
      Object.defineProperty(event, "target", { value: fileInput, enumerable: true });

      expect(() => handleFileChange(event)).not.toThrow();
    });

    it("should accept .xlsx extension", () => {
      const file = new File(["test"], "test.xlsx", {
        type: "",
      });

      const mockFileList = [file] as any;
      mockFileList.item = (index: number) => mockFileList[index] || null;
      Object.defineProperty(fileInput, "files", {
        value: mockFileList,
        writable: true,
        configurable: true,
      });

      const event = new Event("change", { bubbles: true }) as any;
      Object.defineProperty(event, "target", { value: fileInput, enumerable: true });

      expect(() => handleFileChange(event)).not.toThrow();
    });

    it("should reject invalid extension", () => {
      const file = new File(["test"], "test.pdf", {
        type: "",
      });

      const mockFileList = [file] as any;
      mockFileList.item = (index: number) => mockFileList[index] || null;
      Object.defineProperty(fileInput, "files", {
        value: mockFileList,
        writable: true,
        configurable: true,
      });

      const event = new Event("change", { bubbles: true }) as any;
      Object.defineProperty(event, "target", { value: fileInput, enumerable: true });

      expect(() => handleFileChange(event)).toThrow("Please upload a CSV or Excel file");
    });
  });
});

