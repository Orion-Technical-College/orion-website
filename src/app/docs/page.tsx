"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserGuide } from "@/components/documentation/user-guide";

export default function DocsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background-secondary border-b border-border px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="text-foreground-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workspace
        </Button>
      </div>
      <UserGuide />
    </div>
  );
}

