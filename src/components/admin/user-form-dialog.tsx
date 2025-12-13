"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ROLES } from "@/lib/permissions";
import type { UserFormData, Role } from "@/types/admin";
import type { Client } from "@prisma/client";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  initialData?: Partial<UserFormData> & { id?: string };
  clients?: Client[];
  isLoading?: boolean;
}

export function UserFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  clients = [],
  isLoading = false,
}: UserFormDialogProps) {
  const [formData, setFormData] = useState<UserFormData>({
    name: initialData?.name || "",
    email: initialData?.email || "",
    role: initialData?.role || ROLES.RECRUITER,
    clientId: initialData?.clientId,
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
    sendInvite: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        email: initialData.email || "",
        role: initialData.role || ROLES.RECRUITER,
        clientId: initialData.clientId,
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
        sendInvite: false,
      });
    } else {
      setFormData({
        name: "",
        email: "",
        role: ROLES.RECRUITER,
        clientId: undefined,
        isActive: true,
        sendInvite: false,
      });
    }
    setErrors({});
  }, [initialData, open]);

  const requiresClient = formData.role === ROLES.CLIENT_ADMIN || formData.role === ROLES.CLIENT_USER;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }
    }

    if (requiresClient && !formData.clientId) {
      newErrors.clientId = "Client assignment is required for this role";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch (error: any) {
      setErrors({ submit: error.message || "Failed to save user" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData?.id ? "Edit User" : "Create User"}</DialogTitle>
          <DialogDescription>
            {initialData?.id
              ? "Update user information and role."
              : "Create a new user account. You can send an invite email with temporary credentials."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name *
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email *
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john.doe@example.com"
                className={errors.email ? "border-red-500" : ""}
                disabled={!!initialData?.id} // Cannot change email after creation
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              {initialData?.id && (
                <p className="text-xs text-foreground-muted">Email cannot be changed after creation</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                Role *
              </label>
              <Select
                value={formData.role}
                onValueChange={(value) => {
                  setFormData({
                    ...formData,
                    role: value as Role,
                    clientId: value === ROLES.CLIENT_ADMIN || value === ROLES.CLIENT_USER ? formData.clientId : undefined,
                  });
                }}
              >
                <SelectTrigger id="role" className={errors.role ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROLES.PLATFORM_ADMIN}>Platform Admin</SelectItem>
                  <SelectItem value={ROLES.RECRUITER}>Recruiter</SelectItem>
                  <SelectItem value={ROLES.CLIENT_ADMIN}>Client Admin</SelectItem>
                  <SelectItem value={ROLES.CLIENT_USER}>Client User</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
            </div>

            {requiresClient && (
              <div className="space-y-2">
                <label htmlFor="clientId" className="text-sm font-medium">
                  Client *
                </label>
                <Select
                  value={formData.clientId || ""}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                >
                  <SelectTrigger id="clientId" className={errors.clientId ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients
                      .filter((c) => !c.deletedAt && c.isActive)
                      .map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.clientId && <p className="text-sm text-red-500">{errors.clientId}</p>}
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked === true })
                }
              />
              <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                Active (user can log in)
              </label>
            </div>

            {!initialData?.id && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendInvite"
                  checked={formData.sendInvite}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, sendInvite: checked === true })
                  }
                />
                <label htmlFor="sendInvite" className="text-sm font-medium cursor-pointer">
                  Send invite email with temporary password
                </label>
              </div>
            )}

            {errors.submit && (
              <p className="text-sm text-red-500">{errors.submit}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : initialData?.id ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
