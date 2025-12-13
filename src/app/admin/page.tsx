import { redirect } from "next/navigation";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/permissions";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function AdminPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  requireRole(user, ROLES.PLATFORM_ADMIN);

  return <AdminDashboard />;
}
