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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { ClientFormDialog } from "./client-form-dialog";
import { ConfirmDialog } from "./confirm-dialog";
import { cn } from "@/lib/utils";
import type { ClientQueryFilters, ClientFormData } from "@/types/admin";
import type { Client } from "@prisma/client";

interface ClientWithCounts extends Client {
  userCount?: number;
  candidateCount?: number;
}

export function ClientManagement() {
  const [clients, setClients] = useState<ClientWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<ClientQueryFilters>({
    page: 1,
    limit: 25,
    search: "",
    status: undefined,
    sortBy: "createdAt",
    sortDir: "desc",
    includeDeleted: false,
  });

  // Dialog states
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientWithCounts | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientWithCounts | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Copy to clipboard
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch clients
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("page", filters.page.toString());
      params.set("limit", filters.limit.toString());
      if (filters.search) params.set("search", filters.search);
      if (filters.status) params.set("status", filters.status);
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      if (filters.sortDir) params.set("sortDir", filters.sortDir);
      if (filters.includeDeleted) params.set("includeDeleted", "true");

      const response = await fetch(`/api/admin/clients?${params.toString()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to fetch clients");
      }

      setClients(data.data || []);
      setTotal(data.pagination?.total || 0);
      setPagination((prev) => ({
        ...prev,
        pageIndex: data.pagination?.page - 1 || 0,
      }));
    } catch (err: any) {
      console.error("Failed to fetch clients:", err);
      setError(err.message || "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

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

  const columns: ColumnDef<ClientWithCounts>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-accent transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <Search className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("name")}</span>
        ),
      },
      {
        accessorKey: "domain",
        header: "Domain",
        cell: ({ row }) => {
          const domain = row.getValue("domain") as string | null;
          return domain ? (
            <span className="text-sm text-foreground-muted">{domain}</span>
          ) : (
            <span className="text-sm text-foreground-muted">—</span>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => {
          const isActive = row.getValue("isActive") as boolean;
          return (
            <Badge
              variant={isActive ? "default" : "outline"}
              className={cn(
                "text-xs",
                isActive ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
              )}
            >
              {isActive ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "userCount",
        header: "Users",
        cell: ({ row }) => {
          const count = row.original.userCount || 0;
          return <span className="text-sm">{count}</span>;
        },
      },
      {
        accessorKey: "candidateCount",
        header: "Candidates",
        cell: ({ row }) => {
          const count = row.original.candidateCount || 0;
          return <span className="text-sm">{count}</span>;
        },
      },
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => {
          const id = row.getValue("id") as string;
          return (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-foreground-muted">
                {id.substring(0, 8)}...
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(id);
                  setCopiedId(id);
                  setTimeout(() => setCopiedId(null), 2000);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                title="Copy ID"
              >
                {copiedId === id ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3 text-foreground-muted" />
                )}
              </button>
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-accent transition-colors"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created
            <Search className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => {
          const date = new Date(row.getValue("createdAt"));
          return <span className="text-xs text-foreground-muted">{date.toLocaleDateString()}</span>;
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const client = row.original;

          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  setEditingClient(client);
                  setClientFormOpen(true);
                }}
                title="Edit client"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-400 hover:text-red-300"
                onClick={() => {
                  setClientToDelete(client);
                  setDeleteConfirmOpen(true);
                }}
                title="Delete client"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
      },
    ],
    [copiedId]
  );

  const table = useReactTable({
    data: clients,
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

  const handleCreateClient = () => {
    setEditingClient(null);
    setClientFormOpen(true);
  };

  const handleSubmitClient = async (data: ClientFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (editingClient) {
        // Update client
        const response = await fetch(`/api/admin/clients/${editingClient.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error?.message || "Failed to update client");
        }

        setSuccessMessage("Client updated successfully");
      } else {
        // Create client
        const response = await fetch("/api/admin/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error?.message || "Failed to create client");
        }

        setSuccessMessage("Client created successfully");
      }

      setTimeout(() => setSuccessMessage(null), 3000);
      fetchClients();
    } catch (err: any) {
      setError(err.message || "Failed to save client");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`/api/admin/clients/${clientToDelete.id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || result.error?.details || "Failed to delete client");
      }

      setSuccessMessage("Client deleted successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchClients();
    } catch (err: any) {
      setError(err.message || "Failed to delete client");
    } finally {
      setIsSubmitting(false);
      setClientToDelete(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Client Management
              </CardTitle>
              <CardDescription>Manage client organizations</CardDescription>
            </div>
            <Button onClick={handleCreateClient}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-foreground-muted" />
              <Input
                placeholder="Search clients..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="pl-8"
              />
            </div>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  status: value === "all" ? undefined : (value as "ACTIVE" | "INACTIVE"),
                  page: 1,
                })
              }
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-md p-3">
              <p className="text-sm text-green-400">{successMessage}</p>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="text-center py-8 text-foreground-muted">Loading clients...</div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8 text-foreground-muted">
              {filters.search || filters.status ? "No clients found" : "No clients yet"}
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
                            className={cn(
                              "px-3 py-2 text-left text-xs font-medium text-foreground-muted",
                              header.id === "id" && "hidden md:table-cell",
                              header.id === "createdAt" && "hidden md:table-cell"
                            )}
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
                      <tr
                        key={row.id}
                        className="group border-b border-border hover:bg-background-tertiary transition-colors"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className={cn(
                              "px-3 py-2 text-sm",
                              cell.column.id === "id" && "hidden md:table-cell",
                              cell.column.id === "createdAt" && "hidden md:table-cell"
                            )}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-foreground-muted">
                  Showing {table.getState().pagination.pageIndex * filters.limit + 1} to{" "}
                  {Math.min((table.getState().pagination.pageIndex + 1) * filters.limit, total)} of {total} clients
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

      {/* Client Form Dialog */}
      <ClientFormDialog
        open={clientFormOpen}
        onOpenChange={setClientFormOpen}
        onSubmit={handleSubmitClient}
        initialData={editingClient ? {
          id: editingClient.id,
          name: editingClient.name,
          domain: editingClient.domain || undefined,
          isActive: editingClient.isActive,
        } : undefined}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteClient}
        title="Delete Client"
        description={`Are you sure you want to delete ${clientToDelete?.name}? This action cannot be undone.`}
        severity="danger"
        confirmLabel="Delete"
        isLoading={isSubmitting}
      />
    </>
  );
}
