"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Download, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { ROLES, isValidRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { AuditLogFilters, Role } from "@/types/admin";

interface AuditLogEntry {
  id: string;
  createdAt: Date;
  actorId: string;
  actorRole: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: string | null;
  actorName?: string;
  actorEmail?: string | null;
  metadataPreview?: string | null;
  metadataFull?: string | null;
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });
  const [total, setTotal] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 50,
    action: undefined,
    actorRole: undefined,
    targetType: undefined,
    startDate: undefined,
    endDate: undefined,
    search: undefined,
    sortBy: "createdAt",
    sortDir: "desc",
  });

  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch audit logs
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("page", filters.page.toString());
      params.set("limit", filters.limit.toString());
      if (filters.action) params.set("action", filters.action);
      if (filters.actorRole) params.set("actorRole", filters.actorRole);
      if (filters.targetType) params.set("targetType", filters.targetType);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      if (filters.search) params.set("search", filters.search);
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      if (filters.sortDir) params.set("sortDir", filters.sortDir);

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to fetch audit logs");
      }

      // Convert date strings to Date objects
      const formattedLogs = (data.data || []).map((log: any) => ({
        ...log,
        createdAt: new Date(log.createdAt),
      }));

      setLogs(formattedLogs);
      setTotal(data.pagination?.total || 0);
      setPagination((prev) => ({
        ...prev,
        pageIndex: data.pagination?.page - 1 || 0,
      }));
    } catch (err: any) {
      console.error("Failed to fetch audit logs:", err);
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, page: 1 }));
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.search]);

  // Sync pagination with filters
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      page: pagination.pageIndex + 1,
      sortBy: sorting[0]?.id || "createdAt",
      sortDir: sorting[0]?.desc ? "desc" : "asc",
    }));
  }, [pagination.pageIndex, sorting]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.action) params.set("action", filters.action);
      if (filters.actorRole) params.set("actorRole", filters.actorRole);
      if (filters.targetType) params.set("targetType", filters.targetType);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      if (filters.search) params.set("search", filters.search);
      params.set("includeMetadata", "true");

      const response = await fetch(`/api/admin/audit-logs/export?${params.toString()}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || "Failed to export audit logs");
    }
  };

  const columns: ColumnDef<AuditLogEntry>[] = useMemo(
    () => [
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-accent transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Timestamp
            <Search className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => {
          const date = row.getValue("createdAt") as Date;
          return (
            <span className="text-xs font-mono">
              {date.toLocaleString()}
            </span>
          );
        },
      },
      {
        accessorKey: "actorName",
        header: "Actor",
        cell: ({ row }) => {
          const actorName = row.original.actorName || "Unknown";
          const actorEmail = row.original.actorEmail;
          return (
            <div>
              <div className="font-medium text-sm">{actorName}</div>
              {actorEmail && (
                <div className="text-xs text-foreground-muted">{actorEmail}</div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "actorRole",
        header: "Role",
        cell: ({ row }) => {
          const role = row.getValue("actorRole") as string;
          return (
            <Badge variant="outline" className="text-xs">
              {role}
            </Badge>
          );
        },
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.getValue("action")}</span>
        ),
      },
      {
        accessorKey: "targetType",
        header: "Target",
        cell: ({ row }) => {
          const targetType = row.getValue("targetType") as string | null;
          const targetId = row.original.targetId;
          return (
            <div>
              {targetType && <Badge variant="outline" className="text-xs">{targetType}</Badge>}
              {targetId && (
                <div className="text-xs text-foreground-muted mt-1 font-mono">
                  {targetId.substring(0, 8)}...
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "metadataPreview",
        header: "Details",
        cell: ({ row }) => {
          const preview = row.getValue("metadataPreview") as string | null;
          return preview ? (
            <span className="text-xs text-foreground-muted line-clamp-2">
              {preview}
            </span>
          ) : (
            <span className="text-xs text-foreground-muted">—</span>
          );
        },
      },
      {
        id: "expand",
        header: "",
        cell: ({ row }) => {
          const hasMetadata = !!row.original.metadataFull;
          return hasMetadata ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => toggleRow(row.original.id)}
            >
              {expandedRows.has(row.original.id) ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          ) : null;
        },
      },
    ],
    [expandedRows]
  );

  const table = useReactTable({
    data: logs,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / filters.limit),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Audit Logs
            </CardTitle>
            <CardDescription>View system activity and user actions</CardDescription>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-foreground-muted" />
            <Input
              placeholder="Search by action or actor..."
              value={filters.search || ""}
              onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined, page: 1 })}
              className="pl-8"
            />
          </div>
          <Select
            value={filters.actorRole || "all"}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                actorRole: value === "all" ? undefined : (value as Role),
                page: 1,
              })
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value={ROLES.PLATFORM_ADMIN}>Platform Admin</SelectItem>
              <SelectItem value={ROLES.RECRUITER}>Recruiter</SelectItem>
              <SelectItem value={ROLES.CLIENT_ADMIN}>Client Admin</SelectItem>
              <SelectItem value={ROLES.CLIENT_USER}>Client User</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.targetType || "all"}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                targetType: value === "all" ? undefined : value,
                page: 1,
              })
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="User">User</SelectItem>
              <SelectItem value="Client">Client</SelectItem>
              <SelectItem value="Candidate">Candidate</SelectItem>
              <SelectItem value="Campaign">Campaign</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            placeholder="Start Date"
            value={filters.startDate || ""}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined, page: 1 })}
            className="w-[150px]"
          />
          <Input
            type="date"
            placeholder="End Date"
            value={filters.endDate || ""}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined, page: 1 })}
            className="w-[150px]"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="text-center py-8 text-foreground-muted">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-foreground-muted">
            {filters.search || filters.actorRole || filters.targetType ? "No audit logs found" : "No audit logs yet"}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-background-tertiary">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-3 py-2 text-left text-xs font-medium text-foreground-muted"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <React.Fragment key={row.id}>
                      <tr className="group border-b border-border hover:bg-background-tertiary transition-colors">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-3 py-2 text-sm">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                      {expandedRows.has(row.original.id) && row.original.metadataFull && (
                        <tr>
                          <td colSpan={columns.length} className="px-3 py-2 bg-background-tertiary">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-foreground-muted">Full Metadata:</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    navigator.clipboard.writeText(row.original.metadataFull || "");
                                    setCopiedId(row.original.id);
                                    setTimeout(() => setCopiedId(null), 2000);
                                  }}
                                >
                                  {copiedId === row.original.id ? (
                                    <Check className="h-3 w-3 text-green-400" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                              <pre className="text-xs bg-background p-2 rounded border border-border overflow-x-auto">
                                {JSON.stringify(JSON.parse(row.original.metadataFull || "{}"), null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-foreground-muted">
                Showing {table.getState().pagination.pageIndex * filters.limit + 1} to{" "}
                {Math.min((table.getState().pagination.pageIndex + 1) * filters.limit, total)} of {total} logs
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <span className="text-sm text-foreground-muted">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
