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
import { applyCandidateFilters, type FilterState as FilteringFilterState } from "@/lib/filtering";
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
  selectedCandidates: Set<string>;
  onToggleCandidate: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
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

function DataTableComponent({
  data: rawData,
  onRowClick,
  showUnresolvedOnly = false,
  onToggleUnresolved,
  selectedCandidates,
  onToggleCandidate,
  onSelectAll,
  onDeselectAll,
}: DataTableProps) {
  // Defensive check: ensure data is always an array
  const data = rawData || [];
  const [sorting, setSorting] = useState<SortingState>([]);
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

  // Comprehensive filtering logic using extracted utility
  const filterState: FilteringFilterState = useMemo(() => ({
    status: filters.status,
    clients: filters.clients,
    sources: filters.sources,
    locations: filters.locations,
    dateRange: filters.dateRange,
    search: debouncedSearch || "",
  }), [filters, debouncedSearch]);

  const filteredData = useMemo(() => {
    return applyCandidateFilters(data, filterState, showUnresolvedOnly);
  }, [data, filterState, showUnresolvedOnly]);

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
    onToggleCandidate(id);
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
                isSelected={selectedCandidates.has(candidate.id)}
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

// Memoize to prevent unnecessary re-renders
export const DataTable = React.memo(DataTableComponent);
DataTable.displayName = "DataTable";
