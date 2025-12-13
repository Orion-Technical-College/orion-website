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
import { Checkbox } from "@/components/ui/checkbox";
import type { ClientFormData } from "@/types/admin";

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ClientFormData) => Promise<void>;
  initialData?: Partial<ClientFormData> & { id?: string };
  isLoading?: boolean;
}

export function ClientFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading = false,
}: ClientFormDialogProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    name: initialData?.name || "",
    domain: initialData?.domain,
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        domain: initialData.domain,
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
      });
    } else {
      setFormData({
        name: "",
        domain: undefined,
        isActive: true,
      });
    }
    setErrors({});
  }, [initialData, open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Client name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Client name must be at least 2 characters";
    } else if (formData.name.length > 100) {
      newErrors.name = "Client name must be less than 100 characters";
    }

    if (formData.domain && formData.domain.trim().length > 0) {
      const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
      if (!domainRegex.test(formData.domain)) {
        newErrors.domain = "Invalid domain format";
      }
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
      setErrors({ submit: error.message || "Failed to save client" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData?.id ? "Edit Client" : "Create Client"}</DialogTitle>
          <DialogDescription>
            {initialData?.id
              ? "Update client information."
              : "Create a new client organization."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Client Name *
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Client A"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="domain" className="text-sm font-medium">
                Domain (Optional)
              </label>
              <Input
                id="domain"
                value={formData.domain || ""}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value || undefined })}
                placeholder="example.com"
                className={errors.domain ? "border-red-500" : ""}
              />
              {errors.domain && <p className="text-sm text-red-500">{errors.domain}</p>}
              <p className="text-xs text-foreground-muted">
                Used for email domain matching (optional)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked === true })
                }
              />
              <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                Active (client is enabled)
              </label>
            </div>

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
