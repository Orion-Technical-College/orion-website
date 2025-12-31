import type { Metadata } from "next";
import { EliteProvider, EliteShell } from "@/components/elite/layout";

export const metadata: Metadata = {
  title: "ELITE Workspace | EMC",
  description: "Elite Leadership Training - Cohort operations, learner engagement, and outcomes analytics",
};

export default function EliteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EliteProvider>
      <EliteShell>{children}</EliteShell>
    </EliteProvider>
  );
}

