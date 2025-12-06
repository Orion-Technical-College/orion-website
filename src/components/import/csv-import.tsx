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

  const parseFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, string>[];
        if (data.length > 0) {
          const fileHeaders = Object.keys(data[0]);
          setCsvData(data);
          setHeaders(fileHeaders);
          
          // Auto-map columns based on similarity
          const autoMappings: ColumnMapping[] = fileHeaders.map((header) => {
            const headerLower = header.toLowerCase().replace(/[_\s-]/g, "");
            const matchedField = TARGET_FIELDS.find((field) => {
              const fieldLower = field.key.toLowerCase();
              return (
                headerLower.includes(fieldLower) ||
                fieldLower.includes(headerLower) ||
                (field.key === "name" && headerLower.includes("candidate")) ||
                (field.key === "jobTitle" && (headerLower.includes("job") || headerLower.includes("title") || headerLower.includes("position")))
              );
            });
            return {
              sourceColumn: header,
              targetField: matchedField?.key || null,
            };
          });
          
          setMappings(autoMappings);
          setStep("mapping");
        }
      },
      error: (error) => {
        setErrors([`Error parsing file: ${error.message}`]);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      parseFile(selectedFile);
    }
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
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {["Upload", "Map Columns", "Preview"].map((label, index) => {
          const stepNames = ["upload", "mapping", "preview"];
          const isActive = stepNames[index] === step;
          const isComplete = stepNames.indexOf(step) > index;

          return (
            <React.Fragment key={label}>
              <div className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    isComplete && "bg-status-hired text-white",
                    isActive && "bg-accent text-background",
                    !isComplete && !isActive && "bg-background-tertiary text-foreground-muted"
                  )}
                >
                  {isComplete ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                </div>
                <span
                  className={cn(
                    "ml-2 text-sm font-medium",
                    isActive ? "text-accent" : "text-foreground-muted"
                  )}
                >
                  {label}
                </span>
              </div>
              {index < 2 && (
                <div
                  className={cn(
                    "w-16 h-0.5 mx-4",
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

            {errors.length > 0 && (
              <div className="mt-4 p-4 bg-status-denied/10 border border-status-denied/20 rounded-lg">
                {errors.map((error, i) => (
                  <p key={i} className="text-sm text-status-denied flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </p>
                ))}
              </div>
            )}
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
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {mappings.map((mapping) => (
                  <div
                    key={mapping.sourceColumn}
                    className="flex items-center gap-4 p-3 bg-background-tertiary rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {mapping.sourceColumn}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        Sample: {csvData[0]?.[mapping.sourceColumn] || "—"}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-foreground-muted" />
                    <select
                      value={mapping.targetField || ""}
                      onChange={(e) =>
                        updateMapping(
                          mapping.sourceColumn,
                          (e.target.value as keyof Candidate) || null
                        )
                      }
                      className="flex-1 bg-background-secondary border border-border rounded-md px-3 py-2 text-sm"
                    >
                      <option value="">— Skip this column —</option>
                      {TARGET_FIELDS.map((field) => (
                        <option key={field.key} value={field.key}>
                          {field.label} {field.required && "*"}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {errors.length > 0 && (
              <div className="mt-4 p-4 bg-status-denied/10 border border-status-denied/20 rounded-lg">
                {errors.map((error, i) => (
                  <p key={i} className="text-sm text-status-denied flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </p>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={handleProceedToPreview}>
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
              <div className="overflow-x-auto">
                <table className="w-full">
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
              {csvData.length > 5 && (
                <div className="px-4 py-2 bg-background-tertiary text-sm text-foreground-muted">
                  ... and {csvData.length - 5} more rows
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep("mapping")}>
                Back
              </Button>
              <Button onClick={handleImport}>
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

