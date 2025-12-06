export type CandidateStatus =
  | "pending"
  | "interviewed"
  | "hired"
  | "denied"
  | "consent-form-sent";

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  client: string;
  jobTitle: string;
  location: string;
  date: string;
  status: CandidateStatus;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  calendlyUrl: string;
  zoomUrl?: string;
  messageTemplate: string;
  reminderTimings: number[]; // hours before appointment
  status: "draft" | "active" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  candidateId: string;
  personalizedMessage: string;
  sentAt?: Date;
  status: "pending" | "sent" | "skipped";
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  pushSubscription?: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: keyof Candidate | null;
}

