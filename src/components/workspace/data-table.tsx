"use client";

import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { cn, formatPhoneNumber, getStatusColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CandidateCard } from "./candidate-card";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Search,
} from "lucide-react";
import type { Candidate } from "@/types";

interface DataTableProps {
  data: Candidate[];
  onRowClick?: (candidate: Candidate) => void;
  showUnresolvedOnly?: boolean;
  onToggleUnresolved?: () => void;
}

export function DataTable({
  data,
  onRowClick,
  showUnresolvedOnly = false,
  onToggleUnresolved,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
          <span className="font-medium text-foreground whitespace-nowrap">{row.getValue("name")}</span>
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
          <span className="whitespace-nowrap">{formatPhoneNumber(row.getValue("phone"))}</span>
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
            <Badge className={cn("capitalize text-[11px] px-1.5 py-0.5", getStatusColor(status))}>
              {status.replace("-", " ")}
            </Badge>
          );
        },
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) => (
          <span className="text-foreground-muted max-w-[150px] truncate block">
            {row.getValue("notes")}
          </span>
        ),
      },
    ],
    []
  );

  const filteredData = useMemo(() => {
    let result = data;
    
    if (showUnresolvedOnly) {
      result = result.filter(
        (c) => c.status !== "hired" && c.status !== "denied"
      );
    }
    
    if (globalFilter) {
      const search = globalFilter.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search) ||
          c.phone.includes(search) ||
          c.client.toLowerCase().includes(search) ||
          c.jobTitle.toLowerCase().includes(search) ||
          c.location.toLowerCase().includes(search)
      );
    }
    
    return result;
  }, [data, showUnresolvedOnly, globalFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
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
    const candidate = data.find((c) => c.id === id);
    if (candidate) {
      onRowClick?.(candidate);
    }
  };

  return (
    <div className="space-y-2">
      {/* Mobile Toolbar */}
      <div className="flex flex-col gap-2 md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <Input
            placeholder="Search candidates..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Button
          variant={showUnresolvedOnly ? "default" : "outline"}
          onClick={onToggleUnresolved}
          className="h-10"
        >
          <Filter className="h-4 w-4 mr-2" />
          {showUnresolvedOnly ? "Showing Unresolved" : "Show Unresolved Only"}
        </Button>
      </div>

      {/* Desktop Toolbar */}
      <div className="hidden md:flex items-center justify-between gap-2">
        <Button
          variant={showUnresolvedOnly ? "default" : "outline"}
          size="sm"
          onClick={onToggleUnresolved}
          className="h-6 text-[11px] px-2"
        >
          <Filter className="h-3 w-3 mr-1" />
          Show Unresolved Only
        </Button>
        <Input
          placeholder="Search all columns..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-[180px] h-6 text-[11px]"
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3 pb-20">
        {filteredData.length === 0 ? (
          <div className="text-center py-12 text-foreground-muted">
            <p>No candidates found.</p>
            <p className="text-sm mt-1">Import a CSV to get started.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-foreground-muted">
              {filteredData.length} candidate{filteredData.length !== 1 ? "s" : ""}
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
            <table className="w-full text-[12px]">
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
                      No candidates found. Import a CSV to get started.
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
        <div className="flex items-center justify-between text-[12px] mt-2">
          <p className="text-foreground-muted">
            {table.getFilteredRowModel().rows.length} of {data.length} rows
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
                className="h-6 w-6"
              >
                <ChevronsLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-6 w-6"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-6 w-6"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="h-6 w-6"
              >
                <ChevronsRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
