import { Role } from "@/lib/permissions";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  clientId: string | null;
  isInternal: boolean;
  mustChangePassword?: boolean;
}

