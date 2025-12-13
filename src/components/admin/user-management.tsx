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
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Key,
  Copy,
  Check,
  X,
  AlertCircle,
  MoreVertical,
} from "lucide-react";
import { ROLES } from "@/lib/permissions";
import { UserFormDialog } from "./user-form-dialog";
import { ConfirmDialog } from "./confirm-dialog";
import { cn } from "@/lib/utils";
import type { UserQueryFilters, UserFormData, Role } from "@/types/admin";
import type { User, Client } from "@prisma/client";

interface UserWithClient extends User {
  client?: { id: string; name: string } | null;
  actorName?: string;
  actorEmail?: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserWithClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<UserQueryFilters>({
    page: 1,
    limit: 25,
    search: "",
    role: undefined,
    status: undefined,
    sortBy: "createdAt",
    sortDir: "desc",
    includeDeleted: false,
  });

  // Dialog states
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithClient | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resetPasswordConfirmOpen, setResetPasswordConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithClient | null>(null);
  const [userToReset, setUserToReset] = useState<UserWithClient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Copy to clipboard
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("page", filters.page.toString());
      params.set("limit", filters.limit.toString());
      if (filters.search) params.set("search", filters.search);
      if (filters.role) params.set("role", filters.role);
      if (filters.status) params.set("status", filters.status);
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      if (filters.sortDir) params.set("sortDir", filters.sortDir);
      if (filters.includeDeleted) params.set("includeDeleted", "true");

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to fetch users");
      }

      setUsers(data.data || []);
      setTotal(data.pagination?.total || 0);
      setPagination((prev) => ({
        ...prev,
        pageIndex: data.pagination?.page - 1 || 0,
      }));
    } catch (err: any) {
      console.error("Failed to fetch users:", err);
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch clients
  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/clients?limit=1000");
      const data = await response.json();

      if (data.success) {
        setClients(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Sync pagination with filters
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      page: pagination.pageIndex + 1,
      sortBy: sorting[0]?.id || "createdAt",
      sortDir: sorting[0]?.desc ? "desc" : "asc",
    }));
  }, [pagination.pageIndex, sorting]);

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

  const columns: ColumnDef<UserWithClient>[] = useMemo(
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
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.getValue("name")}</span>
            {row.original.emailVerified && (
              <span title="Email verified">
                <Check className="h-3 w-3 text-green-400" />
              </span>
            )}
            {row.original.mustChangePassword && (
              <span title="Must change password">
                <AlertCircle className="h-3 w-3 text-yellow-400" />
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <a
              href={`mailto:${row.getValue("email")}`}
              className="text-accent hover:underline"
            >
              {row.getValue("email")}
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(row.getValue("email"));
                setCopiedId(`email-${row.original.id}`);
                setTimeout(() => setCopiedId(null), 2000);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              title="Copy email"
            >
              {copiedId === `email-${row.original.id}` ? (
                <Check className="h-3 w-3 text-green-400" />
              ) : (
                <Copy className="h-3 w-3 text-foreground-muted" />
              )}
            </button>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
          const role = row.getValue("role") as string;
          const roleLabels: Record<string, string> = {
            PLATFORM_ADMIN: "Platform Admin",
            RECRUITER: "Recruiter",
            CLIENT_ADMIN: "Client Admin",
            CLIENT_USER: "Client User",
            CANDIDATE: "Candidate",
          };
          return (
            <Badge variant="outline" className="text-xs">
              {roleLabels[role] || role}
            </Badge>
          );
        },
      },
      {
        accessorKey: "client",
        header: "Client",
        cell: ({ row }) => {
          const client = row.original.client;
          return client ? (
            <span className="text-sm">{client.name}</span>
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
        accessorKey: "authProvider",
        header: "Auth",
        cell: ({ row }) => {
          const provider = row.getValue("authProvider") as string;
          return (
            <Badge variant="outline" className="text-xs">
              {provider === "azureadb2c" ? "OAuth" : "Credentials"}
            </Badge>
          );
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
          const user = row.original;
          const isOAuth = user.authProvider && user.authProvider !== "credentials";

          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  setEditingUser(user);
                  setUserFormOpen(true);
                }}
                title="Edit user"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              {!isOAuth && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setUserToReset(user);
                    setResetPasswordConfirmOpen(true);
                  }}
                  title="Reset password"
                >
                  <Key className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-400 hover:text-red-300"
                onClick={() => {
                  setUserToDelete(user);
                  setDeleteConfirmOpen(true);
                }}
                title="Delete user"
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
    data: users,
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

  const handleCreateUser = () => {
    setEditingUser(null);
    setUserFormOpen(true);
  };

  const handleSubmitUser = async (data: UserFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (editingUser) {
        // Update user
        const response = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error?.message || "Failed to update user");
        }

        setSuccessMessage("User updated successfully");
      } else {
        // Create user
        const response = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error?.message || "Failed to create user");
        }

        setSuccessMessage("User created successfully");
      }

      setTimeout(() => setSuccessMessage(null), 3000);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Failed to save user");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to delete user");
      }

      setSuccessMessage("User deleted successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Failed to delete user");
    } finally {
      setIsSubmitting(false);
      setUserToDelete(null);
    }
  };

  const handleResetPassword = async () => {
    if (!userToReset) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`/api/admin/users/${userToReset.id}/reset-password`, {
        method: "POST",
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to reset password");
      }

      setSuccessMessage("Password reset successfully. User will be required to change password on next login.");
      setTimeout(() => setSuccessMessage(null), 5000);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
      setUserToReset(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>Manage platform users and their roles</CardDescription>
            </div>
            <Button onClick={handleCreateUser}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-foreground-muted" />
              <Input
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="pl-8"
              />
            </div>
            <Select
              value={filters.role || "all"}
              onValueChange={(value) =>
                setFilters({ ...filters, role: value === "all" ? undefined : (value as Role), page: 1 })
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
            <div className="text-center py-8 text-foreground-muted">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-foreground-muted">
              {filters.search || filters.role || filters.status ? "No users found" : "No users yet"}
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
                  {Math.min((table.getState().pagination.pageIndex + 1) * filters.limit, total)} of {total} users
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

      {/* User Form Dialog */}
      <UserFormDialog
        open={userFormOpen}
        onOpenChange={setUserFormOpen}
        onSubmit={handleSubmitUser}
        initialData={editingUser ? {
          id: editingUser.id,
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role as any,
          clientId: editingUser.clientId || undefined,
          isActive: editingUser.isActive,
        } : undefined}
        clients={clients}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteUser}
        title="Delete User"
        description={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
        severity="danger"
        confirmLabel="Delete"
        isLoading={isSubmitting}
      />

      {/* Reset Password Confirmation */}
      <ConfirmDialog
        open={resetPasswordConfirmOpen}
        onOpenChange={setResetPasswordConfirmOpen}
        onConfirm={handleResetPassword}
        title="Reset Password"
        description={`Reset password for ${userToReset?.name}? A temporary password will be generated and the user will be required to change it on next login.`}
        severity="warning"
        confirmLabel="Reset Password"
        isLoading={isSubmitting}
      />
    </>
  );
}
