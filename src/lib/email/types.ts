export interface EmailPayload {
  toEmail: string;
  toName?: string | null;
  subject: string;
  textBody: string;
  htmlBody: string;
  correlationId?: string;
}

export interface EmailSendResult {
  success: boolean;
  provider: "azure_communication_services" | "disabled";
  messageId?: string;
  error?: string;
}
