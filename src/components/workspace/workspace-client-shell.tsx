"use client";

/**
 * WorkspaceClientShell - Client Component
 * 
 * Receives resolved context from server and renders the workspace UI.
 * This component handles all client-side state for the workspace.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { AIAssistant } from "@/components/layout/ai-assistant";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { DataTable } from "@/components/workspace/data-table";
import { CampaignBuilder } from "@/components/campaigns/campaign-builder";
import { GuidedSend } from "@/components/campaigns/guided-send";
import { CSVImport } from "@/components/import/csv-import";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { ROLES } from "@/lib/permissions";
import type { Candidate, Message } from "@/types";
import type { FilterState } from "@/components/workspace/filter-panel";
import type { WorkspaceKey, WorkspaceResolutionResult } from "@/lib/workspace/types";

// Sample data for demo
const SAMPLE_CANDIDATES: Candidate[] = [
  {
    id: "1",
    name: "Carlos Mela",
    email: "carlos.mela@email.com",
    phone: "(555) 123-4567",
    source: "Indeed",
    client: "Client A",
    jobTitle: "Warehouse Worker",
    location: "San Francisco, CA",
    status: "pending",
    date: new Date().toISOString(),
    notes: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Carlos Mela",
    email: "carlos.mela@email.com",
    phone: "(555) 123-4567",
    source: "Indeed",
    client: "Client B",
    jobTitle: "Forklift Operator",
    location: "Oakland, CA",
    status: "pending",
    date: new Date().toISOString(),
    notes: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "(555) 234-5678",
    source: "Referral",
    client: "Client C",
    jobTitle: "Office Assistant",
    location: "Palo Alto, CA",
    status: "pending",
    date: new Date().toISOString(),
    notes: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    name: "Michael Chen",
    email: "michael.chen@email.com",
    phone: "(555) 345-6789",
    source: "Indeed",
    client: "Client A",
    jobTitle: "Delivery Driver",
    location: "San Francisco, CA",
    status: "pending",
    date: new Date().toISOString(),
    notes: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

interface WorkspaceClientShellProps {
  workspaceKey: WorkspaceKey;
  context: WorkspaceResolutionResult;
}

export function WorkspaceClientShell({ 
  workspaceKey, 
  context 
}: WorkspaceClientShellProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("workspace");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>(SAMPLE_CANDIDATES);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const [workspaceTab, setWorkspaceTab] = useState("data-table");
  const [campaignRecipients, setCampaignRecipients] = useState<Candidate[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [chatInput, setChatInput] = useState("");

  // Check if user is Platform Admin
  const isPlatformAdmin = session?.user?.role === ROLES.PLATFORM_ADMIN;

  // Load candidates from database
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await fetch("/api/candidates?limit=100");
        if (response.ok) {
          const data = await response.json();
          if (data.candidates && data.candidates.length > 0) {
            setCandidates(data.candidates);
          }
        }
      } catch (error) {
        console.error("Failed to fetch candidates:", error);
      }
    };

    fetchCandidates();
  }, []);

  // Tab change handler
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  }, []);

  // Selection handlers
  const handleSelectCandidate = useCallback((id: string) => {
    setSelectedCandidates((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedCandidates((prev) =>
      prev.length === candidates.length ? [] : candidates.map((c) => c.id)
    );
  }, [candidates]);

  const handleSelectMultiple = useCallback((ids: string[]) => {
    setSelectedCandidates(ids);
  }, []);

  // AI Assistant handlers
  const handleAIMessage = useCallback(
    async (content: string) => {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date(),
      };
      setAiMessages((prev) => [...prev, userMessage]);
      setChatInput("");

      // Simulate AI response
      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `I can help you manage data in your workspace. Upload a CSV file or describe the data you want to add to the table.`,
          timestamp: new Date(),
        };
        setAiMessages((prev) => [...prev, assistantMessage]);
      }, 1000);
    },
    []
  );

  // Import handler
  const handleImport = useCallback((importedCandidates: Partial<Candidate>[]) => {
    // Convert partial candidates to full candidates with defaults
    const fullCandidates: Candidate[] = importedCandidates.map((c, index) => ({
      id: c.id || `imported-${Date.now()}-${index}`,
      name: c.name || "",
      email: c.email || "",
      phone: c.phone || "",
      source: c.source || "",
      client: c.client || "",
      jobTitle: c.jobTitle || "",
      location: c.location || "",
      status: c.status || "pending",
      date: c.date || new Date().toISOString(),
      notes: c.notes || "",
      createdAt: c.createdAt || new Date(),
      updatedAt: c.updatedAt || new Date(),
    }));
    setCandidates((prev) => [...prev, ...fullCandidates]);
    setActiveTab("workspace");
  }, []);

  // Filter handler
  const handleFilter = useCallback((filters: FilterState) => {
    // Filter implementation
  }, []);

  // Campaign handlers
  const handleSendCampaign = useCallback(() => {
    const recipients = candidates.filter((c) => selectedCandidates.includes(c.id));
    setCampaignRecipients(recipients);
    setWorkspaceTab("send-sms");
  }, [candidates, selectedCandidates]);

  // Mobile menu toggle
  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  // Render based on workspace key
  const renderWorkspaceHeader = () => {
    return (
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-accent">
          {context.display.name}
        </h1>
        <p className="text-xs text-foreground-muted">
          {context.display.description}
        </p>
        {/* Debug: Show workspace key in dev */}
        {process.env.NODE_ENV === "development" && (
          <p className="text-[10px] text-foreground-muted/50 mt-1">
            workspaceKey: {workspaceKey}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block">
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          userName={session?.user?.name || context.tenantName}
          showAdmin={isPlatformAdmin}
        />
      </div>

      {/* Mobile Navigation */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onMenuOpen={toggleMobileMenu}
        onAIOpen={() => {}}
      />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onNavigate={handleTabChange}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden pt-12 md:pt-0">
        {/* Content Area */}
        <div className="flex-1 overflow-auto p-3">
          {activeTab === "workspace" && (
            <div className="h-full flex flex-col">
              {renderWorkspaceHeader()}
              <Tabs
                value={workspaceTab}
                onValueChange={setWorkspaceTab}
                className="flex-1 flex flex-col"
              >
                <TabsList className="bg-background-secondary mb-3">
                  <TabsTrigger
                    value="data-table"
                    className="text-xs data-[state=active]:bg-accent data-[state=active]:text-background"
                  >
                    Data Table
                  </TabsTrigger>
                  <TabsTrigger
                    value="import"
                    className="text-xs data-[state=active]:bg-accent data-[state=active]:text-background"
                  >
                    Import Candidates
                  </TabsTrigger>
                  <TabsTrigger
                    value="send-sms"
                    className="text-xs data-[state=active]:bg-accent data-[state=active]:text-background"
                  >
                    Send SMS
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="data-table" className="flex-1 m-0">
                  <DataTable
                    data={candidates}
                    selectedCandidates={selectedRows}
                    onToggleCandidate={(id) => {
                      setSelectedRows(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(id)) {
                          newSet.delete(id);
                        } else {
                          newSet.add(id);
                        }
                        return newSet;
                      });
                    }}
                    onSelectAll={() => {
                      setSelectedRows(new Set(candidates.map(c => c.id)));
                    }}
                    onDeselectAll={() => {
                      setSelectedRows(new Set());
                    }}
                  />
                </TabsContent>

                <TabsContent value="import" className="flex-1 m-0">
                  <CSVImport onImport={handleImport} />
                </TabsContent>

                <TabsContent value="send-sms" className="flex-1 m-0">
                  {/* GuidedSend requires sessionId from campaigns workflow */}
                  <div className="p-4 text-center text-foreground-muted">
                    <p>Start a campaign to use Guided Send</p>
                    <button
                      onClick={() => setWorkspaceTab("data-table")}
                      className="mt-2 text-accent hover:underline"
                    >
                      Go back
                    </button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {activeTab === "campaigns" && (
            <CampaignBuilder
              candidates={candidates}
              selectedCandidates={new Set(selectedCandidates)}
              onToggleCandidate={handleSelectCandidate}
              onSelectAll={handleSelectAll}
              onDeselectAll={() => setSelectedCandidates([])}
            />
          )}

          {activeTab === "import" && <CSVImport onImport={handleImport} />}

          {activeTab === "settings" && <SettingsPanel />}

          {activeTab === "docs" && (
            <div className="prose prose-invert max-w-none">
              <h1>Documentation</h1>
              <p>Help documentation coming soon.</p>
            </div>
          )}
        </div>

        {/* AI Assistant Panel - Desktop Only */}
        {activeTab === "workspace" && (
          <div className="hidden lg:block">
            <AIAssistant
              isOpen={true}
              onToggle={() => {}}
              onUploadCSV={() => {}}
              messages={aiMessages}
              onSendMessage={handleAIMessage}
            />
          </div>
        )}
      </main>
    </div>
  );
}

