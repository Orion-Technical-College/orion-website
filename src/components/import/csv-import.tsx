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

  const parseFile = async (file: File) => {
    // Detect file type before parsing
    const fileType = await detectFileType(file);
    
    if (fileType === "excel" || fileType === "binary") {
      setErrors([
        "Excel files (.xlsx, .xls) are not directly supported. Please export your file as CSV first.",
        "To convert: Open in Excel/Google Sheets → File → Save As → CSV format"
      ]);
      setFile(null);
      return;
    }
    
    if (fileType === "unknown") {
      setErrors([
        "Unsupported file type. Please upload a CSV file.",
        "The file may be corrupted or in an unsupported format."
      ]);
      setFile(null);
      return;
    }

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
          
          // Auto-map columns based on similarity with improved email detection
          const autoMappings: ColumnMapping[] = fileHeaders.map((header) => {
            const headerLower = header.toLowerCase().replace(/[_\s-]/g, "");
            const matchedField = TARGET_FIELDS.find((field) => {
              const fieldLower = field.key.toLowerCase();
              
              // Enhanced matching logic
              if (field.key === "email") {
                // Match email variations: email, e-mail, email address, mail, etc.
                return (
                  headerLower.includes("email") ||
                  headerLower.includes("e-mail") ||
                  headerLower === "mail" ||
                  headerLower.includes("mailaddress") ||
                  (headerLower.includes("contact") && headerLower.includes("email"))
                );
              }
              
              if (field.key === "phone") {
                // Match phone variations
                return (
                  headerLower.includes("phone") ||
                  headerLower.includes("tel") ||
                  headerLower.includes("mobile") ||
                  headerLower.includes("cell") ||
                  headerLower.includes("number")
                );
              }
              
              if (field.key === "name") {
                return (
                  headerLower.includes("name") ||
                  headerLower.includes("candidate") ||
                  headerLower === "fullname" ||
                  headerLower === "full_name"
                );
              }
              
              if (field.key === "jobTitle") {
                return (
                  headerLower.includes("job") ||
                  headerLower.includes("title") ||
                  headerLower.includes("position") ||
                  headerLower.includes("role") ||
                  (headerLower.includes("job") && headerLower.includes("title"))
                );
              }
              
              if (field.key === "location") {
                return (
                  headerLower.includes("location") ||
                  headerLower.includes("address") ||
                  headerLower.includes("city") ||
                  (headerLower.includes("candidate") && headerLower.includes("location"))
                );
              }
              
              if (field.key === "client") {
                return (
                  headerLower.includes("client") ||
                  headerLower.includes("company") ||
                  headerLower.includes("employer")
                );
              }
              
              // Default matching for other fields
              return (
                headerLower.includes(fieldLower) ||
                fieldLower.includes(headerLower)
              );
            });
            return {
              sourceColumn: header,
              targetField: matchedField?.key || null,
            };
          });
          
          setMappings(autoMappings);
          setStep("mapping");
        } else {
          setErrors(["File appears to be empty or could not be parsed"]);
        }
      },
      error: (error) => {
        // Check if error is due to binary content
        if (error.message?.includes("binary") || error.message?.includes("Invalid")) {
          setErrors([
            "This file appears to be a binary file (Excel/ZIP format), not a CSV.",
            "Please export your file as CSV: Open in Excel/Sheets → File → Save As → CSV"
          ]);
        } else {
          setErrors([
            `Error parsing file: ${error.message || "Unknown error"}`,
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
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
            <ScrollArea className="h-[calc(100vh-400px)] sm:h-[400px] min-h-[300px] max-h-[500px] pr-2 sm:pr-4">
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
                          className="w-full sm:flex-1 bg-background-secondary border border-border rounded-md px-3 py-2 text-sm min-w-[140px]"
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

            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end gap-3">
              <Button variant="outline" onClick={() => setStep("upload")} className="w-full sm:w-auto">
                Back
              </Button>
              <Button onClick={handleProceedToPreview} className="w-full sm:w-auto">
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

            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end gap-3">
              <Button variant="outline" onClick={() => setStep("mapping")} className="w-full sm:w-auto">
                Back
              </Button>
              <Button onClick={handleImport} className="w-full sm:w-auto">
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

