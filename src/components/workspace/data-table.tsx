"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { cn, formatPhoneNumber, getStatusColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CandidateCard } from "./candidate-card";
import { FilterPanel, type FilterState } from "./filter-panel";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import type { Candidate } from "@/types";

interface DataTableProps {
  data: Candidate[];
  onRowClick?: (candidate: Candidate) => void;
  showUnresolvedOnly?: boolean;
  onToggleUnresolved?: () => void;
}

// Debounce hook for search performance
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function DataTable({
  data,
  onRowClick,
  showUnresolvedOnly = false,
  onToggleUnresolved,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    clients: [],
    sources: [],
    locations: [],
    dateRange: { start: "", end: "" },
    search: "",
  });

  // Debounce search for performance with large datasets
  const debouncedSearch = useDebounce(filters.search, 300);

  const columns: ColumnDef<Candidate>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-accent transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Candidate Name
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-medium text-foreground whitespace-nowrap">
            {row.getValue("name")}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-accent transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Email
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <a
            href={`mailto:${row.getValue("email")}`}
            className="text-accent hover:underline whitespace-nowrap"
          >
            {row.getValue("email")}
          </a>
        ),
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {formatPhoneNumber(row.getValue("phone"))}
          </span>
        ),
      },
      {
        accessorKey: "source",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-accent transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Source
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
      },
      {
        accessorKey: "client",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-accent transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Client
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
      },
      {
        accessorKey: "jobTitle",
        header: "Job Title",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{row.getValue("jobTitle")}</span>
        ),
      },
      {
        accessorKey: "location",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-accent transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Location
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{row.getValue("location")}</span>
        ),
      },
      {
        accessorKey: "date",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-accent transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{row.getValue("date")}</span>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-accent transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return (
            <Badge
              className={cn(
                "capitalize text-[11px] px-1.5 py-0.5",
                getStatusColor(status)
              )}
            >
              {status.replace("-", " ")}
            </Badge>
          );
        },
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) => (
          <span className="text-foreground-muted max-w-[150px] truncate block text-xs">
            {row.getValue("notes")}
          </span>
        ),
      },
    ],
    []
  );

  // Comprehensive filtering logic
  const filteredData = useMemo(() => {
    let result = [...data];

    // Unresolved filter
    if (showUnresolvedOnly) {
      result = result.filter(
        (c) => c.status !== "hired" && c.status !== "denied"
      );
    }

    // Status filter
    if (filters.status.length > 0) {
      result = result.filter((c) => filters.status.includes(c.status));
    }

    // Client filter
    if (filters.clients.length > 0) {
      result = result.filter((c) => filters.clients.includes(c.client));
    }

    // Source filter
    if (filters.sources.length > 0) {
      result = result.filter((c) => filters.sources.includes(c.source));
    }

    // Location filter
    if (filters.locations.length > 0) {
      result = result.filter((c) => filters.locations.includes(c.location));
    }

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      result = result.filter((c) => {
        if (!c.date) return false;
        const candidateDate = new Date(c.date);
        if (filters.dateRange.start) {
          const startDate = new Date(filters.dateRange.start);
          if (candidateDate < startDate) return false;
        }
        if (filters.dateRange.end) {
          const endDate = new Date(filters.dateRange.end);
          endDate.setHours(23, 59, 59, 999); // Include entire end date
          if (candidateDate > endDate) return false;
        }
        return true;
      });
    }

    // Global search (debounced)
    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search) ||
          c.phone.replace(/\D/g, "").includes(search.replace(/\D/g, "")) ||
          (c.client && c.client.toLowerCase().includes(search)) ||
          (c.jobTitle && c.jobTitle.toLowerCase().includes(search)) ||
          (c.location && c.location.toLowerCase().includes(search)) ||
          (c.source && c.source.toLowerCase().includes(search)) ||
          (c.notes && c.notes.toLowerCase().includes(search))
      );
    }

    return result;
  }, [data, showUnresolvedOnly, filters, debouncedSearch]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 25, // Increased for better performance with filtering
      },
    },
  });

  const handleCardSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    const foundCandidate = data.find((c) => c.id === id);
    if (foundCandidate) {
      onRowClick?.(foundCandidate);
    }
  };

  const clearAllFilters = useCallback(() => {
    setFilters({
      status: [],
      clients: [],
      sources: [],
      locations: [],
      dateRange: { start: "", end: "" },
      search: "",
    });
    if (showUnresolvedOnly && onToggleUnresolved) {
      onToggleUnresolved();
    }
  }, [showUnresolvedOnly, onToggleUnresolved]);

  return (
    <div className="space-y-2">
      {/* Filter Panel */}
      <FilterPanel
        data={data}
        filters={filters}
        onFiltersChange={setFilters}
        onClearAll={clearAllFilters}
        showUnresolvedOnly={showUnresolvedOnly}
        onToggleUnresolved={onToggleUnresolved || (() => {})}
      />

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3 pb-20">
        {filteredData.length === 0 ? (
          <div className="text-center py-12 text-foreground-muted">
            <p>No candidates found.</p>
            <p className="text-sm mt-1">
              {data.length === 0
                ? "Import a CSV to get started."
                : "Try adjusting your filters."}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-foreground-muted">
              {filteredData.length} candidate{filteredData.length !== 1 ? "s" : ""}
              {filteredData.length !== data.length && ` of ${data.length}`}
            </p>
            {filteredData.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                isSelected={selectedIds.has(candidate.id)}
                onSelect={() => handleCardSelect(candidate.id)}
              />
            ))}
          </>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="rounded-md border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-background-tertiary">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-2.5 py-2 text-left text-[11px] font-semibold text-foreground-muted uppercase tracking-wider"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-border">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-2.5 py-6 text-center text-foreground-muted"
                    >
                      {data.length === 0
                        ? "No candidates found. Import a CSV to get started."
                        : "No candidates match your filters. Try adjusting your search criteria."}
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="bg-background-secondary hover:bg-background-tertiary transition-colors cursor-pointer"
                      onClick={() => onRowClick?.(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-2.5 py-1.5 text-foreground"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Desktop Pagination */}
        <div className="flex items-center justify-between text-xs mt-2">
          <p className="text-foreground-muted">
            Showing {table.getRowModel().rows.length} of {filteredData.length} filtered
            {filteredData.length !== data.length && ` (${data.length} total)`}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-foreground-muted">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </p>
            <div className="flex items-center gap-0.5">
              <Button
                variant="outline"
                size="icon"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="h-7 w-7"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-7 w-7"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-7 w-7"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="h-7 w-7"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
