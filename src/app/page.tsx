"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const { data: session, status: sessionStatus } = useSession();

  const handleTabChange = useCallback((tab: string) => {
    if (tab === "docs") {
      router.push("/docs");
    } else {
      setActiveTab(tab);
    }
  }, [router]);
  
  const [workspaceTab, setWorkspaceTab] = useState("data");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>(SAMPLE_CANDIDATES);
  const [guidedSendSessionId, setGuidedSendSessionId] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState("");
  
  // AI Assistant state - minimal version
  const [aiOpen, setAiOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  // Ref to access latest messages without causing callback recreation
  const messagesRef = useRef<Message[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  
  // Check if user has AI access
  const userRole = session?.user?.role;
  const hasAIAccess = sessionStatus === "authenticated" && 
    (userRole === ROLES.PLATFORM_ADMIN || userRole === ROLES.RECRUITER);
  
  const handleAIToggle = useCallback(() => {
    setAiOpen(prev => !prev);
  }, []);
  
  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsAiLoading(true);
    setAiError(null);
    
    try {
      // Use ref to get latest messages without dependency
      const conversationHistory = messagesRef.current.map(m => ({ 
        role: m.role, 
        content: m.content 
      }));
      
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          conversationHistory,
          includeDataContext: true,
        }),
      });

      let data;
      let rawText;
      
      if (!response.ok) {
        // Try to get error details from response body
        try {
          rawText = await response.text();
          console.error(`[AI_CLIENT] API error ${response.status}:`, rawText);
          try {
            data = JSON.parse(rawText);
          } catch {
            // If not JSON, use status text
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
          }
          throw new Error(data.error || data.detail || `API Error: ${response.status}`);
        } catch (e: any) {
          throw new Error(e.message || `API Error: ${response.status}`);
        }
      }

      try {
        data = await response.json();
      } catch (parseError) {
        console.error("[AI_CLIENT] Failed to parse success response:", parseError);
        throw new Error("Received invalid response from server");
      }

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response || "I'm sorry, I couldn't generate a response.",
        timestamp: new Date(),
        correlationId: data.correlationId,
        traceId: data.traceId, // Langfuse trace ID for feedback
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Error calling AI API:", error);
      setAiError(error.message || "An error occurred. Please try again.");
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAiLoading(false);
    }
  }, []); // Empty dependency array - callback never recreates
  
  const handleUploadCSV = useCallback((file: File) => {
    console.log("CSV upload:", file.name);
  }, []);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [showUnresolved, setShowUnresolved] = useState(false);

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

  const handleToggleUnresolved = useCallback(() => {
    setShowUnresolved((prev) => !prev);
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
  }, []);

  const handleMobileMenuOpen = useCallback(() => {
    setMobileMenuOpen(true);
  }, []);

  const handleMobileMenuClose = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const handleMobileAIOpen = useCallback(() => {}, []);

  const handleMobileNavigate = useCallback((tab: string) => {
    if (tab === "settings" || tab === "profile" || tab === "notifications" || tab === "security") {
      setActiveTab("settings");
    } else {
      setActiveTab(tab);
    }
  }, []);

  const handleRowClick = useCallback((candidate: Candidate) => {
    handleToggleCandidate(candidate.id);
  }, [handleToggleCandidate]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          userName={session?.user?.name}
          showAdmin={userRole === ROLES.PLATFORM_ADMIN}
        />
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
                        onToggleUnresolved={handleToggleUnresolved}
                        selectedCandidates={selectedCandidates}
                        onToggleCandidate={handleToggleCandidate}
                        onSelectAll={handleSelectAll}
                        onDeselectAll={handleDeselectAll}
                      />
                    </TabsContent>

                    <TabsContent value="import" className="mt-2">
                      <CSVImport onImport={handleImport} />
                    </TabsContent>

                    <TabsContent value="send" className="mt-2">
                      {guidedSendSessionId ? (
                        <GuidedSend
                          sessionId={guidedSendSessionId}
                          campaignName={campaignName || "Campaign"}
                          onBack={() => setGuidedSendSessionId(null)}
                          onComplete={() => {
                            setGuidedSendSessionId(null);
                            setWorkspaceTab("data");
                          }}
                        />
                      ) : (
                        <CampaignBuilder
                          candidates={candidates}
                          selectedCandidates={selectedCandidates}
                          onToggleCandidate={handleToggleCandidate}
                          onSelectAll={handleSelectAll}
                          onDeselectAll={handleDeselectAll}
                          onStartGuidedSend={(sessionId) => {
                            setGuidedSendSessionId(sessionId);
                          }}
                        />
                      )}
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Mobile - show data table directly */}
                <div className="md:hidden">
                  <DataTable
                    data={candidates}
                    onRowClick={handleRowClick}
                    showUnresolvedOnly={showUnresolved}
                    onToggleUnresolved={handleToggleUnresolved}
                    selectedCandidates={selectedCandidates}
                    onToggleCandidate={handleToggleCandidate}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                  />
                </div>
              </>
            )}

            {activeTab === "campaigns" && (
              guidedSendSessionId ? (
                <GuidedSend
                  sessionId={guidedSendSessionId}
                  campaignName={campaignName || "Campaign"}
                  onBack={() => setGuidedSendSessionId(null)}
                  onComplete={() => {
                    setGuidedSendSessionId(null);
                    setActiveTab("workspace");
                  }}
                />
              ) : (
                <CampaignBuilder
                  candidates={candidates}
                  selectedCandidates={selectedCandidates}
                  onToggleCandidate={handleToggleCandidate}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                  onStartGuidedSend={(sessionId) => {
                    setGuidedSendSessionId(sessionId);
                  }}
                />
              )
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
          {hasAIAccess && (
            <div className="hidden md:block">
              <AIAssistant
                isOpen={aiOpen}
                onToggle={handleAIToggle}
                onUploadCSV={handleUploadCSV}
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isAiLoading}
                error={aiError}
              />
            </div>
          )}
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onMenuOpen={handleMobileMenuOpen}
        onAIOpen={handleMobileAIOpen}
        showAI={false}
      />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={handleMobileMenuClose}
        onNavigate={handleMobileNavigate}
      />
    </div>
  );
}
