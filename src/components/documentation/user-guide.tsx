"use client";

import React from "react";
import {
  Filter,
  MessageSquare,
  Upload,
  Sparkles,
  Settings,
  Phone,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function UserGuide() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">EMC Workspace User Guide</h1>
        <p className="text-foreground-muted">
          Complete guide to using the EMC Recruiter Workflow Automation Platform
        </p>
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-accent" />
            Quick Start
          </CardTitle>
          <CardDescription>
            Get started in 3 simple steps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">1. Import Candidates</h3>
            <p className="text-sm text-foreground-muted">
              Go to the <strong>Import</strong> tab and upload a CSV or Excel file with candidate data.
              The system will help you map columns to the correct fields.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">2. Review & Filter</h3>
            <p className="text-sm text-foreground-muted">
              Use the <strong>Workspace</strong> tab to view all candidates. Use filters to find specific candidates quickly.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">3. Send SMS Campaigns</h3>
            <p className="text-sm text-foreground-muted">
              Create personalized SMS campaigns in the <strong>Campaigns</strong> tab and send messages directly from your phone.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Importing Candidates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-accent" />
            Importing Candidates
          </CardTitle>
          <CardDescription>
            How to import candidate data from CSV or Excel files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Step 1: Prepare Your File</h3>
            <p className="text-sm text-foreground-muted">
              Your CSV or Excel file should include columns for candidate information. Required fields:
            </p>
            <ul className="list-disc list-inside text-sm text-foreground-muted space-y-1 ml-4">
              <li><strong>Name</strong> - Candidate&apos;s full name</li>
              <li><strong>Email</strong> - Email address</li>
              <li><strong>Phone</strong> - Phone number (any format)</li>
            </ul>
            <p className="text-sm text-foreground-muted mt-2">
              Optional but recommended fields: Source, Client, Job Title, Location, Date, Status, Notes
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Step 2: Upload File</h3>
            <ol className="list-decimal list-inside text-sm text-foreground-muted space-y-1 ml-4">
              <li>Click the <strong>Import</strong> tab in the sidebar</li>
              <li>Drag and drop your file or click to browse</li>
              <li>Wait for the file to upload and parse</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Step 3: Map Columns</h3>
            <p className="text-sm text-foreground-muted">
              The system will show you your file&apos;s columns. Map each column to the correct field:
            </p>
            <ul className="list-disc list-inside text-sm text-foreground-muted space-y-1 ml-4">
              <li>Select the appropriate field from the dropdown for each column</li>
              <li>Skip columns you don&apos;t need by selecting &quot;Skip&quot;</li>
              <li>Review the preview to ensure data looks correct</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Step 4: Import</h3>
            <p className="text-sm text-foreground-muted">
              Click <strong>Import Candidates</strong> to add them to your workspace. The system will:
            </p>
            <ul className="list-disc list-inside text-sm text-foreground-muted space-y-1 ml-4">
              <li>Check for duplicate entries (by email or phone)</li>
              <li>Validate required fields</li>
              <li>Add candidates to your data table</li>
            </ul>
          </div>

          <div className="bg-background-tertiary rounded-md p-3 border border-border">
            <p className="text-xs text-foreground-muted">
              <strong>Tip:</strong> You can download a sample CSV file from the Import tab to see the expected format.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Data Table & Filtering */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-accent" />
            Data Table & Filtering
          </CardTitle>
          <CardDescription>
            How to efficiently find and manage candidates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Viewing Candidates</h3>
            <p className="text-sm text-foreground-muted">
              The <strong>Workspace</strong> tab shows all your candidates in a sortable table. On mobile, candidates are displayed as cards for easier viewing.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Search</h3>
            <p className="text-sm text-foreground-muted">
              Use the search box to find candidates across all columns:
            </p>
            <ul className="list-disc list-inside text-sm text-foreground-muted space-y-1 ml-4">
              <li>Searches name, email, phone, client, job title, location, and notes</li>
              <li>Search is automatically debounced for performance</li>
              <li>Works instantly as you type</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Multi-Select Filters</h3>
            <p className="text-sm text-foreground-muted">
              Filter by multiple criteria simultaneously:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <div className="bg-background-tertiary rounded-md p-3 border border-border">
                <h4 className="font-medium text-sm mb-1">Status Filter</h4>
                <p className="text-xs text-foreground-muted">
                  Select one or more statuses: Pending, Interviewed, Hired, Denied, Consent Form Sent
                </p>
              </div>
              <div className="bg-background-tertiary rounded-md p-3 border border-border">
                <h4 className="font-medium text-sm mb-1">Client Filter</h4>
                <p className="text-xs text-foreground-muted">
                  Filter by specific clients. Select multiple clients to see candidates from all of them.
                </p>
              </div>
              <div className="bg-background-tertiary rounded-md p-3 border border-border">
                <h4 className="font-medium text-sm mb-1">Source Filter</h4>
                <p className="text-xs text-foreground-muted">
                  Filter by where candidates came from: Indeed, LinkedIn, Referral, etc.
                </p>
              </div>
              <div className="bg-background-tertiary rounded-md p-3 border border-border">
                <h4 className="font-medium text-sm mb-1">Location Filter</h4>
                <p className="text-xs text-foreground-muted">
                  Filter by candidate location. Useful for regional searches.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Date Range Filter</h3>
            <p className="text-sm text-foreground-muted">
              Filter candidates by date:
            </p>
            <ul className="list-disc list-inside text-sm text-foreground-muted space-y-1 ml-4">
              <li>Set a start date to see candidates from that date forward</li>
              <li>Set an end date to see candidates up to that date</li>
              <li>Use both to see candidates within a specific time period</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Quick Filters</h3>
            <p className="text-sm text-foreground-muted">
              Use these buttons for common filter combinations:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="text-xs">Show Unresolved Only</Badge>
              <Badge variant="outline" className="text-xs">Active Candidates</Badge>
              <Badge variant="outline" className="text-xs">Hired Only</Badge>
              <Badge variant="outline" className="text-xs">Denied Only</Badge>
            </div>
            <ul className="list-disc list-inside text-sm text-foreground-muted space-y-1 ml-4 mt-2">
              <li><strong>Show Unresolved Only:</strong> Hides Hired and Denied candidates</li>
              <li><strong>Active Candidates:</strong> Shows Pending, Interviewed, and Consent Form Sent</li>
              <li><strong>Hired Only:</strong> Shows only successfully hired candidates</li>
              <li><strong>Denied Only:</strong> Shows only denied candidates</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Filter Chips</h3>
            <p className="text-sm text-foreground-muted">
              Active filters appear as chips above the filter controls:
            </p>
            <ul className="list-disc list-inside text-sm text-foreground-muted space-y-1 ml-4">
              <li>Click the <strong>X</strong> on any chip to remove that filter</li>
              <li>Click <strong>Clear All</strong> to remove all filters at once</li>
              <li>Chips show the number of selected items for multi-select filters</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Sorting</h3>
            <p className="text-sm text-foreground-muted">
              Click any column header with a sort icon to sort by that column:
            </p>
            <ul className="list-disc list-inside text-sm text-foreground-muted space-y-1 ml-4">
              <li>First click: Sort ascending (A-Z, 1-9)</li>
              <li>Second click: Sort descending (Z-A, 9-1)</li>
              <li>Third click: Remove sort</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Pagination</h3>
            <p className="text-sm text-foreground-muted">
              The table shows 25 candidates per page. Use the pagination controls at the bottom to navigate:
            </p>
            <ul className="list-disc list-inside text-sm text-foreground-muted space-y-1 ml-4">
              <li>First page (⏮): Jump to the first page</li>
              <li>Previous (◀): Go to previous page</li>
              <li>Next (▶): Go to next page</li>
              <li>Last page (⏭): Jump to the last page</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* SMS Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-accent" />
            SMS Campaigns
          </CardTitle>
          <CardDescription>
            Create and send personalized SMS messages to candidates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Creating a Campaign</h3>
            <ol className="list-decimal list-inside text-sm text-foreground-muted space-y-1 ml-4">
              <li>Go to the <strong>Campaigns</strong> tab</li>
              <li>Click <strong>Create New Campaign</strong></li>
              <li>Enter a campaign name (e.g., &quot;Interview Reminders - Week 1&quot;)</li>
              <li>Optionally add Calendly and Zoom links</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Message Template</h3>
            <p className="text-sm text-foreground-muted">
              Write your message template using merge tags that will be replaced with candidate data:
            </p>
            <div className="bg-background-tertiary rounded-md p-3 border border-border mt-2">
              <p className="text-xs font-mono text-foreground-muted mb-2">Available merge tags:</p>
              <ul className="list-disc list-inside text-xs text-foreground-muted space-y-1 ml-4">
                <li><code className="bg-background-secondary px-1 rounded">{"{{name}}"}</code> - Candidate&apos;s name</li>
                <li><code className="bg-background-secondary px-1 rounded">{"{{city}}"}</code> - City from location</li>
                <li><code className="bg-background-secondary px-1 rounded">{"{{role}}"}</code> - Job title</li>
                <li><code className="bg-background-secondary px-1 rounded">{"{{calendly_link}}"}</code> - Calendly scheduling link</li>
                <li><code className="bg-background-secondary px-1 rounded">{"{{zoom_link}}"}</code> - Zoom meeting link</li>
              </ul>
            </div>
            <div className="bg-background-tertiary rounded-md p-3 border border-border mt-2">
              <p className="text-xs font-semibold text-foreground mb-1">Example Template:</p>
              <p className="text-xs text-foreground-muted font-mono whitespace-pre-wrap">
                Hi {"{{name}}"}, you&apos;ve been selected for a {"{{role}}"} position! Schedule your interview here: {"{{calendly_link}}"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Selecting Candidates</h3>
            <p className="text-sm text-foreground-muted">
              Choose which candidates to include in your campaign:
            </p>
            <ul className="list-disc list-inside text-sm text-foreground-muted space-y-1 ml-4">
              <li>Use filters in the Workspace tab to narrow down candidates</li>
              <li>Select individual candidates by clicking the checkbox</li>
              <li>Use <strong>Select All</strong> to include all filtered candidates</li>
              <li>Use <strong>Deselect All</strong> to clear selections</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Quick Send</h3>
            <p className="text-sm text-foreground-muted">
              The Quick Send feature opens your phone&apos;s Messages app with pre-filled content:
            </p>
            <ol className="list-decimal list-inside text-sm text-foreground-muted space-y-1 ml-4">
              <li>Click <strong>Send</strong> next to a candidate</li>
              <li>Your phone&apos;s Messages app opens with the recipient and message pre-filled</li>
              <li>Review and tap send in Messages</li>
              <li>Return to the app - it automatically moves to the next candidate</li>
            </ol>
            <div className="bg-accent-muted rounded-md p-3 border border-accent mt-2">
              <p className="text-xs text-foreground">
                <strong>Why Quick Send?</strong> Messages come from your personal number, making them feel more personal to candidates. No carrier opt-in requirements!
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Batch Mode</h3>
            <p className="text-sm text-foreground-muted">
              For sending multiple messages efficiently:
            </p>
            <ul className="list-disc list-inside text-sm text-foreground-muted space-y-1 ml-4">
              <li>Select all candidates you want to message</li>
              <li>Click <strong>Start Batch Send</strong></li>
              <li>Tap through candidates one by one</li>
              <li>Each tap opens Messages app, send, then returns to next candidate</li>
              <li>50 messages can be sent in ~5 minutes vs hours of manual typing</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Reminder Tracking</h3>
            <p className="text-sm text-foreground-muted">
              Set reminder timings (e.g., 24 hours, 2 hours before interview):
            </p>
            <ul className="list-disc list-inside text-sm text-foreground-muted space-y-1 ml-4">
              <li>Configure when reminders should be sent</li>
              <li>The system tracks when messages were sent</li>
              <li>Use this to schedule follow-up reminders</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* AI Assistant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            AI Assistant
          </CardTitle>
          <CardDescription>
            Get help with data management using AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Upload CSV via Chat</h3>
            <p className="text-sm text-foreground-muted">
              You can upload CSV files directly through the AI Assistant:
            </p>
            <ol className="list-decimal list-inside text-sm text-foreground-muted space-y-1 ml-4">
              <li>Open the AI Assistant panel (right side or bottom on mobile)</li>
              <li>Click <strong>Upload CSV/Excel</strong></li>
              <li>Select your file</li>
              <li>The AI will help process and import the data</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Natural Language Queries</h3>
            <p className="text-sm text-foreground-muted">
              Ask questions about your data in plain English:
            </p>
            <div className="bg-background-tertiary rounded-md p-3 border border-border mt-2">
              <p className="text-xs font-semibold text-foreground mb-2">Example Questions:</p>
              <ul className="list-disc list-inside text-xs text-foreground-muted space-y-1 ml-4">
                <li>&quot;Show me all candidates in Oakland&quot;</li>
                <li>&quot;How many candidates are pending?&quot;</li>
                <li>&quot;List all hired candidates for Client A&quot;</li>
                <li>&quot;Add a new candidate named John Doe&quot;</li>
                <li>&quot;Update Sarah Johnson&apos;s status to Interviewed&quot;</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Data Management</h3>
            <p className="text-sm text-foreground-muted">
              The AI can help you:
            </p>
            <ul className="list-disc list-inside text-sm text-foreground-muted space-y-1 ml-4">
              <li>Add new candidates through conversation</li>
              <li>Update existing candidate information</li>
              <li>Get insights about your candidate pipeline</li>
              <li>Generate reports and summaries</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Status Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-accent" />
            Candidate Status Management
          </CardTitle>
          <CardDescription>
            Understanding and managing candidate statuses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Status Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <div className="bg-background-tertiary rounded-md p-3 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-status-pending text-white text-xs">Pending</Badge>
                </div>
                <p className="text-xs text-foreground-muted">
                  New candidates or those awaiting action
                </p>
              </div>
              <div className="bg-background-tertiary rounded-md p-3 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-status-interviewed text-black text-xs">Interviewed</Badge>
                </div>
                <p className="text-xs text-foreground-muted">
                  Candidates who have completed interviews
                </p>
              </div>
              <div className="bg-background-tertiary rounded-md p-3 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-status-hired text-white text-xs">Hired</Badge>
                </div>
                <p className="text-xs text-foreground-muted">
                  Successfully hired candidates
                </p>
              </div>
              <div className="bg-background-tertiary rounded-md p-3 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-status-denied text-white text-xs">Denied</Badge>
                </div>
                <p className="text-xs text-foreground-muted">
                  Candidates who were not selected
                </p>
              </div>
              <div className="bg-background-tertiary rounded-md p-3 border border-border md:col-span-2">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-status-consent-sent text-white text-xs">Consent Form Sent</Badge>
                </div>
                <p className="text-xs text-foreground-muted">
                  Consent forms have been sent, awaiting response
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Updating Status</h3>
            <p className="text-sm text-foreground-muted">
              To update a candidate&apos;s status:
            </p>
            <ul className="list-disc list-inside text-sm text-foreground-muted space-y-1 ml-4">
              <li>Click on a candidate row in the table</li>
              <li>Edit the status field in the candidate details</li>
              <li>Or use the AI Assistant: &quot;Update [Name]&apos;s status to [Status]&quot;</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Unresolved Candidates</h3>
            <p className="text-sm text-foreground-muted">
              The &quot;Show Unresolved Only&quot; filter shows candidates that need attention:
            </p>
            <ul className="list-disc list-inside text-sm text-foreground-muted space-y-1 ml-4">
              <li>Excludes Hired and Denied candidates</li>
              <li>Shows: Pending, Interviewed, Consent Form Sent</li>
              <li>Perfect for daily workflow management</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-accent" />
            Mobile Usage
          </CardTitle>
          <CardDescription>
            Using EMC Workspace on your phone
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Installing as PWA</h3>
            <p className="text-sm text-foreground-muted">
              Install the app on your phone for quick access:
            </p>
            <ul className="list-disc list-inside text-sm text-foreground-muted space-y-1 ml-4">
              <li><strong>iOS:</strong> Tap Share → Add to Home Screen</li>
              <li><strong>Android:</strong> Tap Menu → Install App / Add to Home Screen</li>
              <li>The app will appear like a native app on your home screen</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Mobile Navigation</h3>
            <p className="text-sm text-foreground-muted">
              On mobile, use the bottom navigation bar:
            </p>
            <ul className="list-disc list-inside text-sm text-foreground-muted space-y-1 ml-4">
              <li><strong>Menu:</strong> Access Settings and other options</li>
              <li><strong>Workspace:</strong> View candidates (card view)</li>
              <li><strong>Campaigns:</strong> Create and manage SMS campaigns</li>
              <li><strong>Import:</strong> Upload CSV files</li>
              <li><strong>AI:</strong> Open AI Assistant</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Quick Send on Mobile</h3>
            <p className="text-sm text-foreground-muted">
              The Quick Send workflow is optimized for mobile:
            </p>
            <ol className="list-decimal list-inside text-sm text-foreground-muted space-y-1 ml-4">
              <li>Open a campaign on your phone</li>
              <li>Tap &quot;Send&quot; on a candidate</li>
              <li>Messages app opens with pre-filled content</li>
              <li>Send the message</li>
              <li>Return to app - automatically moves to next candidate</li>
              <li>Repeat for all candidates</li>
            </ol>
          </div>

          <div className="bg-accent-muted rounded-md p-3 border border-accent mt-2">
            <p className="text-xs text-foreground">
              <strong>Pro Tip:</strong> Install the app on your phone and use it during Quick Send sessions. You can send 50+ personalized messages in just a few minutes!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tips & Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-accent" />
            Tips & Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="bg-background-tertiary rounded-md p-3 border border-border">
              <h4 className="font-medium text-sm mb-1">📊 Data Management</h4>
              <ul className="list-disc list-inside text-xs text-foreground-muted space-y-1 ml-4">
                <li>Keep candidate data up to date by regularly updating statuses</li>
                <li>Use notes field to track important information about each candidate</li>
                <li>Filter before selecting candidates for campaigns to avoid mistakes</li>
              </ul>
            </div>

            <div className="bg-background-tertiary rounded-md p-3 border border-border">
              <h4 className="font-medium text-sm mb-1">💬 SMS Campaigns</h4>
              <ul className="list-disc list-inside text-xs text-foreground-muted space-y-1 ml-4">
                <li>Test your message template with one candidate before batch sending</li>
                <li>Keep messages concise - SMS has a 160 character limit per message</li>
                <li>Personalize with merge tags to make messages feel authentic</li>
                <li>Schedule reminder campaigns for Tuesday/Thursday as needed</li>
              </ul>
            </div>

            <div className="bg-background-tertiary rounded-md p-3 border border-border">
              <h4 className="font-medium text-sm mb-1">🔍 Filtering</h4>
              <ul className="list-disc list-inside text-xs text-foreground-muted space-y-1 ml-4">
                <li>Combine multiple filters for precise searches (e.g., Status + Client + Location)</li>
                <li>Use &quot;Show Unresolved Only&quot; for daily workflow management</li>
                <li>Save time by using quick filter buttons for common searches</li>
                <li>Clear filters when switching between different searches</li>
              </ul>
            </div>

            <div className="bg-background-tertiary rounded-md p-3 border border-border">
              <h4 className="font-medium text-sm mb-1">⚡ Performance</h4>
              <ul className="list-disc list-inside text-xs text-foreground-muted space-y-1 ml-4">
                <li>The search is debounced - wait a moment after typing for results</li>
                <li>Use filters instead of scrolling through hundreds of records</li>
                <li>Pagination shows 25 candidates per page for optimal performance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-accent" />
            Troubleshooting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm mb-1">CSV Import Issues</h4>
              <ul className="list-disc list-inside text-xs text-foreground-muted space-y-1 ml-4">
                <li><strong>File won&apos;t upload:</strong> Check file size (max 10MB) and format (CSV or Excel)</li>
                <li><strong>Columns not mapping:</strong> Ensure your CSV has headers in the first row</li>
                <li><strong>Data looks wrong:</strong> Check for special characters or formatting issues in your CSV</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-1">SMS Not Sending</h4>
              <ul className="list-disc list-inside text-xs text-foreground-muted space-y-1 ml-4">
                <li><strong>Messages app doesn&apos;t open:</strong> Make sure you&apos;re using a mobile device or have a default messaging app set</li>
                <li><strong>Phone number format:</strong> The system accepts any format, but ensure numbers are correct</li>
                <li><strong>Message too long:</strong> SMS messages should be under 160 characters</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-1">Filters Not Working</h4>
              <ul className="list-disc list-inside text-xs text-foreground-muted space-y-1 ml-4">
                <li><strong>No results:</strong> Try clearing all filters and starting fresh</li>
                <li><strong>Filters not applying:</strong> Check that you&apos;ve selected items in the dropdown (look for checkmarks)</li>
                <li><strong>Search not finding:</strong> Try different search terms or check spelling</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-1">General Issues</h4>
              <ul className="list-disc list-inside text-xs text-foreground-muted space-y-1 ml-4">
                <li><strong>App seems slow:</strong> Clear filters and try again, or refresh the page</li>
                <li><strong>Data not saving:</strong> Check your internet connection</li>
                <li><strong>Can&apos;t find a feature:</strong> Check all tabs in the sidebar - features are organized by workflow</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-accent" />
            Keyboard Shortcuts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-background-tertiary rounded-md p-3 border border-border">
              <kbd className="text-xs font-mono bg-background-secondary px-2 py-1 rounded border border-border">
                Ctrl/Cmd + F
              </kbd>
              <p className="text-xs text-foreground-muted mt-1">Focus search box</p>
            </div>
            <div className="bg-background-tertiary rounded-md p-3 border border-border">
              <kbd className="text-xs font-mono bg-background-secondary px-2 py-1 rounded border border-border">
                Esc
              </kbd>
              <p className="text-xs text-foreground-muted mt-1">Clear search</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Additional support resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground-muted">
            For additional support or to report issues, please contact your system administrator or refer to the technical documentation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

