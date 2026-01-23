"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  X,
} from "lucide-react";
import type { Candidate, ColumnMapping } from "@/types";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface CSVImportProps {
  onImport: (candidates: Partial<Candidate>[]) => void;
}

const TARGET_FIELDS: { key: keyof Candidate; label: string; required: boolean }[] = [
  { key: "name", label: "Candidate Name", required: true },
  { key: "email", label: "Email", required: true },
  { key: "phone", label: "Phone", required: true },
  { key: "source", label: "Source", required: false },
  { key: "client", label: "Client", required: false },
  { key: "jobTitle", label: "Job Title", required: false },
  { key: "location", label: "Location", required: false },
  { key: "date", label: "Date", required: false },
  { key: "status", label: "Status", required: false },
  { key: "notes", label: "Notes", required: false },
];

/**
 * Improved auto-mapping logic that checks both header names and sample data
 */
function autoMapColumn(
  header: string,
  sampleValue: string,
  allHeaders: string[]
): keyof Candidate | null {
  const headerLower = header.toLowerCase().replace(/[_\s-]/g, "");
  const sampleLower = sampleValue.toLowerCase().trim();
  
  // Check for email
  if (
    headerLower.includes("email") ||
    headerLower.includes("e-mail") ||
    headerLower === "mail" ||
    headerLower.includes("mailaddress") ||
    (headerLower.includes("contact") && headerLower.includes("email"))
  ) {
    // Validate: sample should contain @ symbol
    if (sampleValue.includes("@")) {
      return "email";
    }
  }
  
  // Check for phone
  if (
    headerLower.includes("phone") ||
    headerLower.includes("tel") ||
    headerLower.includes("mobile") ||
    headerLower.includes("cell") ||
    headerLower.includes("number")
  ) {
    // Validate: sample should contain digits
    if (/\d/.test(sampleValue)) {
      return "phone";
    }
  }
  
  // Check for location (with strict validation)
  const locationPatterns = [
    headerLower.includes("location"),
    headerLower.includes("address"),
    headerLower.includes("city"),
    headerLower.includes("state"),
    headerLower.includes("zip"),
    headerLower.includes("postal"),
  ];
  
  // Check if sample data looks like location (City, State format)
  const looksLikeLocation = 
    /^[^,]+,\s*[A-Z]{2}(\s+\d{5})?$/i.test(sampleValue) || // "City, ST" or "City, ST 12345"
    sampleLower.includes("virginia") ||
    sampleLower.includes("california") ||
    sampleLower.includes("texas") ||
    sampleLower.match(/\b(street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd)\b/i);
  
  if (locationPatterns.some(Boolean) || looksLikeLocation) {
    return "location";
  }
  
  // Check for name (with negative patterns to exclude locations)
  const namePatterns = [
    headerLower.includes("name"),
    headerLower.includes("candidate"),
    headerLower === "fullname",
    headerLower === "full_name",
  ];
  
  // Negative patterns: exclude if header or sample suggests location
  const negativePatterns = [
    headerLower.includes("city"),
    headerLower.includes("state"),
    headerLower.includes("zip"),
    headerLower.includes("address"),
    headerLower.includes("location"),
    sampleLower.includes("virginia"),
    sampleLower.includes("california"),
    sampleLower.includes("texas"),
    // Reject if sample contains comma (likely "City, State" format)
    sampleValue.includes(",") && /^[^,]+,\s*[A-Z]{2}/i.test(sampleValue),
  ];
  
  if (namePatterns.some(Boolean) && !negativePatterns.some(Boolean)) {
    // Additional validation: name should not look like location
    if (!looksLikeLocation && !sampleValue.includes(",")) {
      return "name";
    }
  }
  
  // Check for jobTitle
  if (
    headerLower.includes("job") ||
    headerLower.includes("title") ||
    headerLower.includes("position") ||
    headerLower.includes("role") ||
    (headerLower.includes("job") && headerLower.includes("title"))
  ) {
    return "jobTitle";
  }
  
  // Check for client
  if (
    headerLower.includes("client") ||
    headerLower.includes("company") ||
    headerLower.includes("employer")
  ) {
    return "client";
  }
  
  return null;
}

export function CSVImport({ onImport }: CSVImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [step, setStep] = useState<"upload" | "mapping" | "preview">("upload");
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const detectFileType = async (file: File): Promise<"csv" | "excel" | "binary" | "unknown"> => {
    // Check file extension first
    const extension = file.name.toLowerCase().split('.').pop();
    if (extension === 'xlsx' || extension === 'xls') {
      return "excel";
    }
    if (extension === 'csv') {
      // Read first few bytes to check for binary content
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          if (arrayBuffer) {
            const bytes = new Uint8Array(arrayBuffer.slice(0, 4));
            // Check for ZIP signature (Excel files are ZIP archives)
            if (bytes[0] === 0x50 && bytes[1] === 0x4B) {
              resolve("binary");
            } else {
              resolve("csv");
            }
          } else {
            resolve("csv");
          }
        };
        reader.onerror = () => resolve("csv");
        reader.readAsArrayBuffer(file.slice(0, 4));
      });
    }
    return "unknown";
  };

  const parseExcelFile = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      
      // Get the first worksheet
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        setErrors(["Excel file appears to be empty or has no worksheets"]);
        return;
      }
      
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON with header row (array format)
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1, // Use array format first
        defval: "", // Default value for empty cells
        raw: false, // Convert dates and numbers to strings
      }) as unknown[][];
      
      if (jsonData.length === 0) {
        setErrors(["Excel file appears to be empty"]);
        return;
      }
      
      // First row is headers
      const headers = jsonData[0] as unknown[];
      if (!headers || headers.length === 0) {
        setErrors(["Excel file has no header row"]);
        return;
      }
      
      // Clean headers (remove BOM, trim, filter empty)
      const cleanedHeaders = headers
        .map((h) => String(h).replace(/^\uFEFF/, "").trim())
        .filter((h) => h !== "" && h !== "__parsed_extra" && !h.startsWith("__"));
      
      if (cleanedHeaders.length === 0) {
        setErrors(["Excel file has no valid column headers"]);
        return;
      }
      
      // Convert remaining rows to objects
      const dataRows = jsonData.slice(1);
      const parsedData: Record<string, string>[] = dataRows
        .filter((row) => row && row.length > 0) // Filter empty rows
        .map((row) => {
          const rowObj: Record<string, string> = {};
          cleanedHeaders.forEach((header, index) => {
            const value = row[index];
            // Convert to string and clean
            let cleaned = value != null ? String(value).trim() : "";
            // Remove leading/trailing quotes
            if (cleaned.startsWith("'") || cleaned.startsWith('"')) {
              cleaned = cleaned.slice(1);
            }
            if (cleaned.endsWith("'") || cleaned.endsWith('"')) {
              cleaned = cleaned.slice(0, -1);
            }
            rowObj[header] = cleaned;
          });
          return rowObj;
        });
      
      if (parsedData.length === 0) {
        setErrors(["Excel file has no data rows"]);
        return;
      }
      
      // Set data and proceed with mapping (same as CSV flow)
      setCsvData(parsedData);
      setHeaders(cleanedHeaders);
      
      // Auto-map columns using improved logic with sample data validation
      const autoMappings: ColumnMapping[] = cleanedHeaders.map((header) => {
        // Get sample value from first data row
        const sampleValue = parsedData[0]?.[header] || "";
        const matchedField = autoMapColumn(header, sampleValue, cleanedHeaders);
        
        return {
          sourceColumn: header,
          targetField: matchedField,
        };
      });
      
      setMappings(autoMappings);
      setStep("mapping");
    } catch (error) {
      console.error("Excel parsing error:", error);
      setErrors([
        `Error parsing Excel file: ${error instanceof Error ? error.message : "Unknown error"}`,
        "Please ensure your Excel file is properly formatted and not corrupted."
      ]);
    }
  };

  const parseFile = async (file: File) => {
    // Detect file type before parsing
    const fileType = await detectFileType(file);
    
    // Handle Excel files
    if (fileType === "excel") {
      await parseExcelFile(file);
      return;
    }
    
    // Handle binary files that might be Excel
    if (fileType === "binary") {
      // Try to parse as Excel first
      const extension = file.name.toLowerCase().split('.').pop();
      if (extension === 'xlsx' || extension === 'xls') {
        await parseExcelFile(file);
        return;
      }
      // Otherwise show error
      setErrors([
        "This file appears to be a binary file, not a CSV.",
        "Please export your file as CSV: Open in Excel/Sheets → File → Save As → CSV"
      ]);
      setFile(null);
      return;
    }
    
    if (fileType === "unknown") {
      setErrors([
        "Unsupported file type. Please upload a CSV or Excel file.",
        "The file may be corrupted or in an unsupported format."
      ]);
      setFile(null);
      return;
    }

    // Parse CSV files
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      transformHeader: (header: string) => {
        // Remove BOM (Byte Order Mark) that can appear on mobile devices
        return header.replace(/^\uFEFF/, "").trim();
      },
      transform: (value: string) => {
        // Clean up values from mobile-exported CSVs
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
      },
      complete: (results) => {
        const data = results.data as Record<string, string>[];
        if (data.length > 0) {
          // Filter out PapaParse artifacts and empty columns
          const fileHeaders = Object.keys(data[0]).filter(
            (header) =>
              header !== "__parsed_extra" &&
              header !== "_parsed_extra" &&
              header.trim() !== "" &&
              !header.startsWith("__")
          );
          
          // Clean data by removing parsed_extra fields
          const cleanedData = data.map((row) => {
            const cleaned: Record<string, string> = {};
            fileHeaders.forEach((header) => {
              cleaned[header] = row[header] || "";
            });
            return cleaned;
          });
          
          setCsvData(cleanedData);
          setHeaders(fileHeaders);
          
          // Auto-map columns using improved logic with sample data validation
          const autoMappings: ColumnMapping[] = fileHeaders.map((header) => {
            // Get sample value from first data row
            const sampleValue = cleanedData[0]?.[header] || "";
            const matchedField = autoMapColumn(header, sampleValue, fileHeaders);
            
            return {
              sourceColumn: header,
              targetField: matchedField,
            };
          });
          
          setMappings(autoMappings);
          setStep("mapping");
        } else {
          setErrors(["File appears to be empty or could not be parsed"]);
        }
      },
      error: (error) => {
        // Check if error is due to binary content - try Excel parsing
        if (error.message?.includes("binary") || error.message?.includes("Invalid")) {
          const extension = file.name.toLowerCase().split('.').pop();
          if (extension === 'xlsx' || extension === 'xls') {
            // Try parsing as Excel
            parseExcelFile(file).catch(() => {
              setErrors([
                "This file appears to be a binary file (Excel/ZIP format), not a CSV.",
                "Please export your file as CSV: Open in Excel/Sheets → File → Save As → CSV"
              ]);
            });
          } else {
            setErrors([
              "This file appears to be a binary file, not a CSV.",
              "Please export your file as CSV: Open in Excel/Sheets → File → Save As → CSV"
            ]);
          }
        } else {
          setErrors([
            `Error parsing CSV file: ${error.message || "Unknown error"}`,
            "Please ensure your CSV file is properly formatted and contains valid text data."
          ]);
        }
      },
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv") || droppedFile.name.endsWith(".xlsx")) {
        setFile(droppedFile);
        parseFile(droppedFile);
      } else {
        setErrors(["Please upload a CSV or Excel file"]);
      }
    }
  }, []);

  const handleFileInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    // Clear value to ensure onChange fires even if same file is selected (iOS fix)
    e.currentTarget.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      // iOS may not trigger properly - add fallback
      return;
    }
    const selectedFile = files[0];
    
    // Validate file exists and has content
    if (selectedFile.size === 0) {
      setErrors(["File is empty"]);
      return;
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
      setErrors(["Please upload a CSV or Excel file"]);
      return;
    }
    
    setFile(selectedFile);
    parseFile(selectedFile).catch((error) => {
      setErrors([`Error processing file: ${error.message || "Unknown error"}`]);
    });
  };

  const updateMapping = (sourceColumn: string, targetField: keyof Candidate | null) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.sourceColumn === sourceColumn ? { ...m, targetField } : m
      )
    );
  };

  const validateMappings = (): boolean => {
    const requiredFields = TARGET_FIELDS.filter((f) => f.required).map((f) => f.key);
    const mappedFields = mappings.filter((m) => m.targetField).map((m) => m.targetField);
    const missingFields = requiredFields.filter((f) => !mappedFields.includes(f));

    if (missingFields.length > 0) {
      setErrors([`Missing required fields: ${missingFields.join(", ")}`]);
      return false;
    }

    setErrors([]);
    return true;
  };

  const handleProceedToPreview = () => {
    if (validateMappings()) {
      setStep("preview");
    }
  };

  const handleImport = () => {
    const importedCandidates: Partial<Candidate>[] = csvData.map((row) => {
      const candidate: Partial<Candidate> = {
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mappings.forEach((mapping) => {
        if (mapping.targetField && row[mapping.sourceColumn]) {
          (candidate as Record<string, unknown>)[mapping.targetField] = row[mapping.sourceColumn];
        }
      });

      // Default status if not mapped
      if (!candidate.status) {
        candidate.status = "pending";
      }

      return candidate;
    });

    onImport(importedCandidates);
    resetForm();
  };

  const resetForm = () => {
    setFile(null);
    setCsvData([]);
    setHeaders([]);
    setMappings([]);
    setStep("upload");
    setErrors([]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24 sm:pb-0">
      {/* Error Banner - Sticky on mobile for visibility */}
      {errors.length > 0 && (
        <div className="sticky top-0 z-50 mb-4 p-4 bg-status-denied/95 backdrop-blur-sm border-b-2 border-status-denied rounded-lg shadow-lg">
          <div className="space-y-2">
            {errors.map((error, i) => (
              <p key={i} className="text-sm sm:text-base text-white flex items-start gap-2 font-medium">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-6 sm:mb-8 overflow-x-auto pb-2">
        {["Upload", "Map Columns", "Preview"].map((label, index) => {
          const stepNames = ["upload", "mapping", "preview"];
          const isActive = stepNames[index] === step;
          const isComplete = stepNames.indexOf(step) > index;

          return (
            <React.Fragment key={label}>
              <div className="flex items-center flex-shrink-0">
                <div
                  className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors",
                    isComplete && "bg-status-hired text-white",
                    isActive && "bg-accent text-background",
                    !isComplete && !isActive && "bg-background-tertiary text-foreground-muted"
                  )}
                >
                  {isComplete ? <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" /> : index + 1}
                </div>
                <span
                  className={cn(
                    "ml-2 text-xs sm:text-sm font-medium whitespace-nowrap",
                    isActive ? "text-accent" : "text-foreground-muted"
                  )}
                >
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{label.split(" ")[0]}</span>
                </span>
              </div>
              {index < 2 && (
                <div
                  className={cn(
                    "w-8 sm:w-16 h-0.5 mx-2 sm:mx-4 flex-shrink-0",
                    isComplete ? "bg-status-hired" : "bg-border"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Import Candidates</CardTitle>
            <CardDescription>
              Upload a CSV or Excel file containing candidate information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
                dragActive ? "border-accent bg-accent-muted" : "border-border",
                "hover:border-accent hover:bg-accent-muted cursor-pointer"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                onClick={handleFileInputClick}
                className="hidden"
              />
              <FileSpreadsheet className="h-12 w-12 mx-auto text-accent mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                Drag and drop your file here
              </p>
              <p className="text-sm text-foreground-muted mb-4">
                or click to browse
              </p>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "mapping" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Map Columns</CardTitle>
                <CardDescription>
                  Match your CSV columns to candidate fields
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-500px)] sm:h-[400px] min-h-[250px] max-h-[500px] pr-2 sm:pr-4">
              <div className="space-y-3">
                {mappings
                  .filter((mapping) => {
                    // Filter out any remaining parsed_extra columns that might have slipped through
                    return (
                      !mapping.sourceColumn.includes("parsed_extra") &&
                      !mapping.sourceColumn.startsWith("__")
                    );
                  })
                  .map((mapping) => {
                    const sampleValue = csvData[0]?.[mapping.sourceColumn] || "";
                    const isGarbled = /^[\x00-\x08\x0E-\x1F\x7F-\x9F]+$/.test(sampleValue) && sampleValue.length > 10;
                    
                    return (
                      <div
                        key={mapping.sourceColumn}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 p-3 bg-background-tertiary rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {mapping.sourceColumn}
                          </p>
                          <p className={cn(
                            "text-xs mt-1 break-words",
                            isGarbled ? "text-status-denied font-medium" : "text-foreground-muted"
                          )}>
                            Sample: {isGarbled ? "⚠️ Invalid data detected" : (sampleValue.substring(0, 50) || "—")}
                            {sampleValue.length > 50 && !isGarbled && "..."}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-foreground-muted hidden sm:block flex-shrink-0" />
                        <select
                          value={mapping.targetField || ""}
                          onChange={(e) =>
                            updateMapping(
                              mapping.sourceColumn,
                              (e.target.value as keyof Candidate) || null
                            )
                          }
                          className="w-full sm:flex-1 bg-background-secondary border border-border rounded-md px-3 py-2 text-sm min-w-[140px] min-h-[44px]"
                        >
                          <option value="">— Skip this column —</option>
                          {TARGET_FIELDS.map((field) => (
                            <option key={field.key} value={field.key}>
                              {field.label} {field.required && "*"}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
              </div>
            </ScrollArea>

            <div className="sticky bottom-0 left-0 right-0 mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end gap-3 bg-background-secondary sm:bg-transparent pt-4 pb-4 sm:pb-0 border-t border-border sm:border-t-0 -mx-6 px-6 sm:mx-0 sm:px-0 z-10">
              <Button variant="outline" onClick={() => setStep("upload")} className="w-full sm:w-auto min-h-[44px]">
                Back
              </Button>
              <Button onClick={handleProceedToPreview} className="w-full sm:w-auto min-h-[44px]">
                Continue to Preview
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "preview" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Preview Import</CardTitle>
                <CardDescription>
                  Review {csvData.length} candidates before importing
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                  <table className="min-w-full divide-y divide-border">
                  <thead className="bg-background-tertiary">
                    <tr>
                      {mappings
                        .filter((m) => m.targetField)
                        .map((m) => (
                          <th
                            key={m.targetField}
                            className="px-4 py-3 text-left text-xs font-semibold text-foreground-muted uppercase"
                          >
                            {TARGET_FIELDS.find((f) => f.key === m.targetField)?.label}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {csvData.slice(0, 5).map((row, i) => (
                      <tr key={i} className="bg-background-secondary">
                        {mappings
                          .filter((m) => m.targetField)
                          .map((m) => (
                            <td
                              key={m.targetField}
                              className="px-4 py-3 text-sm text-foreground"
                            >
                              {row[m.sourceColumn] || "—"}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </div>
              </div>
              {csvData.length > 5 && (
                <div className="px-4 py-2 bg-background-tertiary text-sm text-foreground-muted">
                  ... and {csvData.length - 5} more rows
                </div>
              )}
            </div>

            <div className="sticky bottom-0 left-0 right-0 mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end gap-3 bg-background-secondary sm:bg-transparent pt-4 pb-4 sm:pb-0 border-t border-border sm:border-t-0 -mx-6 px-6 sm:mx-0 sm:px-0 z-10">
              <Button variant="outline" onClick={() => setStep("mapping")} className="w-full sm:w-auto min-h-[44px]">
                Back
              </Button>
              <Button onClick={handleImport} className="w-full sm:w-auto min-h-[44px]">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Import {csvData.length} Candidates
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

