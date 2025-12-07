"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { AIAssistant } from "@/components/layout/ai-assistant";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { MobileAISheet } from "@/components/layout/mobile-ai-sheet";
import { DataTable } from "@/components/workspace/data-table";
import { CampaignBuilder } from "@/components/campaigns/campaign-builder";
import { CSVImport } from "@/components/import/csv-import";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SettingsPanel } from "@/components/settings/settings-panel";
import type { Candidate, Message } from "@/types";

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
    date: "1/14/2025",
    status: "denied",
    notes: "No show for interview",
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
    date: "1/21/2025",
    status: "hired",
    notes: "Starts 02/01",
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
    date: "1/19/2025",
    status: "interviewed",
    notes: "Second round scheduled",
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
    date: "1/17/2025",
    status: "consent-form-sent",
    notes: "Waiting for response",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("workspace");
  const router = useRouter();

  const handleTabChange = useCallback((tab: string) => {
    if (tab === "docs") {
      router.push("/docs");
    } else {
      setActiveTab(tab);
    }
  }, [router]);
  const [workspaceTab, setWorkspaceTab] = useState("data");
  const [aiOpen, setAiOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAIOpen, setMobileAIOpen] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>(SAMPLE_CANDIDATES);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [showUnresolved, setShowUnresolved] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleToggleCandidate = useCallback((id: string) => {
    setSelectedCandidates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedCandidates(new Set(candidates.map((c) => c.id)));
  }, [candidates]);

  const handleDeselectAll = useCallback(() => {
    setSelectedCandidates(new Set());
  }, []);

  const handleImport = useCallback((imported: Partial<Candidate>[]) => {
    const newCandidates = imported.map((c) => ({
      ...c,
      id: c.id || crypto.randomUUID(),
      name: c.name || "",
      email: c.email || "",
      phone: c.phone || "",
      source: c.source || "",
      client: c.client || "",
      jobTitle: c.jobTitle || "",
      location: c.location || "",
      date: c.date || new Date().toLocaleDateString(),
      status: c.status || "pending",
      notes: c.notes || "",
      createdAt: c.createdAt || new Date(),
      updatedAt: new Date(),
    })) as Candidate[];

    setCandidates((prev) => [...prev, ...newCandidates]);
    setActiveTab("workspace");
  }, []);

  const handleUploadCSV = useCallback(() => {
    setActiveTab("import");
    setMobileAIOpen(false);
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsAiLoading(true);

    setTimeout(() => {
      let response = "I understand you want to ";
      
      if (content.toLowerCase().includes("filter") || content.toLowerCase().includes("show")) {
        response = `I can help you filter the data. Currently showing ${candidates.length} candidates. Try using the "Show Unresolved Only" button to filter pending candidates.`;
      } else if (content.toLowerCase().includes("add") || content.toLowerCase().includes("create")) {
        response = "To add new candidates, you can use the Import tab to upload a CSV file, or I can help you add them manually. What candidate information would you like to add?";
      } else if (content.toLowerCase().includes("send") || content.toLowerCase().includes("sms") || content.toLowerCase().includes("message")) {
        response = `You have ${selectedCandidates.size} candidates selected for messaging. Go to the Campaigns tab to create and send personalized SMS messages.`;
      } else {
        response = `I can help you manage your candidate data. You currently have ${candidates.length} candidates in the workspace. Try asking me to filter data, add candidates, or help with SMS campaigns.`;
      }

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsAiLoading(false);
    }, 1000);
  }, [candidates.length, selectedCandidates.size]);

  const handleRowClick = useCallback((candidate: Candidate) => {
    handleToggleCandidate(candidate.id);
  }, [handleToggleCandidate]);

  const handleMobileNavigate = useCallback((tab: string) => {
    if (tab === "settings" || tab === "profile" || tab === "notifications" || tab === "security") {
      setActiveTab("settings");
    } else {
      setActiveTab(tab);
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex-shrink-0 h-12 border-b border-border bg-background-secondary flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-background font-bold text-sm">E</span>
            </div>
            <span className="font-semibold text-foreground">EMC</span>
          </div>
            <h1 className="text-sm font-medium text-accent">
            {activeTab === "workspace" && "Workspace"}
            {activeTab === "campaigns" && "Campaigns"}
            {activeTab === "import" && "Import"}
            {activeTab === "settings" && "Settings"}
            {activeTab === "docs" && "Help & Documentation"}
          </h1>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex flex-shrink-0 h-9 border-b border-border bg-background-secondary items-center px-3">
          <div>
            <h1 className="text-xs font-semibold text-accent leading-tight">
              {activeTab === "workspace" && "Workspace"}
              {activeTab === "campaigns" && "SMS Campaigns"}
              {activeTab === "import" && "Import Candidates"}
              {activeTab === "settings" && "Settings"}
              {activeTab === "docs" && "Help & Documentation"}
            </h1>
            <p className="text-[10px] text-foreground-muted leading-tight">
              {activeTab === "workspace" && "Data workspace with AI-powered assistance"}
              {activeTab === "campaigns" && "Create and send personalized SMS campaigns"}
              {activeTab === "import" && "Import candidates from CSV or Excel files"}
              {activeTab === "settings" && "Configure your workspace settings"}
              {activeTab === "docs" && "Complete user guide and documentation"}
            </p>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main content - mobile has bottom padding for nav */}
          <div className="flex-1 overflow-auto p-3 md:p-3 pb-20 md:pb-3">
            {activeTab === "workspace" && (
              <>
                {/* Desktop tabs */}
                <div className="hidden md:block">
                  <Tabs value={workspaceTab} onValueChange={setWorkspaceTab}>
                    <TabsList>
                      <TabsTrigger value="data">Data Table</TabsTrigger>
                      <TabsTrigger value="import">Import Candidates</TabsTrigger>
                      <TabsTrigger value="send">Send SMS</TabsTrigger>
                    </TabsList>

                    <TabsContent value="data" className="mt-2">
                      <DataTable
                        data={candidates}
                        onRowClick={handleRowClick}
                        showUnresolvedOnly={showUnresolved}
                        onToggleUnresolved={() => setShowUnresolved(!showUnresolved)}
                      />
                    </TabsContent>

                    <TabsContent value="import" className="mt-2">
                      <CSVImport onImport={handleImport} />
                    </TabsContent>

                    <TabsContent value="send" className="mt-2">
                      <CampaignBuilder
                        candidates={candidates}
                        selectedCandidates={selectedCandidates}
                        onToggleCandidate={handleToggleCandidate}
                        onSelectAll={handleSelectAll}
                        onDeselectAll={handleDeselectAll}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
                
                {/* Mobile - direct data table */}
                <div className="md:hidden">
                  <DataTable
                    data={candidates}
                    onRowClick={handleRowClick}
                    showUnresolvedOnly={showUnresolved}
                    onToggleUnresolved={() => setShowUnresolved(!showUnresolved)}
                  />
                </div>
              </>
            )}

            {activeTab === "campaigns" && (
              <CampaignBuilder
                candidates={candidates}
                selectedCandidates={selectedCandidates}
                onToggleCandidate={handleToggleCandidate}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
              />
            )}

            {activeTab === "import" && <CSVImport onImport={handleImport} />}

            {activeTab === "docs" && (
              <div className="max-w-4xl">
                <p className="text-foreground-muted mb-4">
                  Redirecting to documentation...
                </p>
              </div>
            )}

            {activeTab === "settings" && <SettingsPanel />}
          </div>

          {/* Desktop AI Assistant */}
          <div className="hidden md:block">
            <AIAssistant
              isOpen={aiOpen}
              onToggle={() => setAiOpen(!aiOpen)}
              onUploadCSV={handleUploadCSV}
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isAiLoading}
            />
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onMenuOpen={() => setMobileMenuOpen(true)}
        onAIOpen={() => setMobileAIOpen(true)}
      />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onNavigate={handleMobileNavigate}
      />

      {/* Mobile AI Sheet */}
      <MobileAISheet
        isOpen={mobileAIOpen}
        onClose={() => setMobileAIOpen(false)}
        onUploadCSV={handleUploadCSV}
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isAiLoading}
      />
    </div>
  );
}
