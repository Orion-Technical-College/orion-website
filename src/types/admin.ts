import type { Role } from "@/lib/permissions";

export type { Role } from "@/lib/permissions";
export type SortDirection = 'asc' | 'desc';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type ClientStatus = 'ACTIVE' | 'INACTIVE';

export interface AdminStats {
  totalUsers: number;
  usersByRole: Record<Role, number>;
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  totalCandidates: number;
  recentAuditLogs: number; // Last 24 hours
  systemHealth: {
    database: 'healthy' | 'degraded' | 'down';
    azureOpenAI: 'healthy' | 'degraded' | 'down';
  };
}

export interface UserFormData {
  name: string;
  email: string;
  role: Role;
  clientId?: string;
  isActive: boolean;
  sendInvite?: boolean;
}

export interface ClientFormData {
  name: string;
  domain?: string;
  isActive: boolean;
}

export interface UserQueryFilters {
  page: number;
  limit: number;
  search?: string;
  role?: Role;
  status?: UserStatus;
  sortBy?: string;
  sortDir?: SortDirection;
  includeDeleted?: boolean;
}

export interface ClientQueryFilters {
  page: number;
  limit: number;
  search?: string;
  status?: ClientStatus;
  sortBy?: string;
  sortDir?: SortDirection;
  includeDeleted?: boolean;
}

export interface AuditLogFilters {
  page: number;
  limit: number;
  action?: string;
  actorRole?: Role;
  targetType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortDir?: SortDirection;
}

export interface SystemFeatureFlag {
  key: string; // e.g., 'FEATURE_AI_ASSISTANT'
  isEnabled: boolean;
  description: string;
  lastUpdated: Date;
  updatedBy: string;
  updatedByName?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
