import { sendWithAzureCommunicationServices } from "./azure-email";
import { buildInviteEmailTemplate, buildPasswordEmailTemplate } from "./templates";
import type { EmailSendResult } from "./types";

interface InviteEmailInput {
  toEmail: string;
  toName?: string | null;
  temporaryPassword: string;
  correlationId?: string;
}

interface PasswordEmailInput {
  toEmail: string;
  toName?: string | null;
  password: string;
  customPasswordUsed: boolean;
  correlationId?: string;
}

function getLoginUrl() {
  const baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/login`;
}

function emailDisabled() {
  return process.env.EMAIL_INVITE_ENABLED === "false";
}

async function sendEmail(args: {
  toEmail: string;
  toName?: string | null;
  subject: string;
  textBody: string;
  htmlBody: string;
  correlationId?: string;
}): Promise<EmailSendResult> {
  if (emailDisabled()) {
    return {
      success: false,
      provider: "disabled",
      error: "Email delivery is disabled by EMAIL_INVITE_ENABLED=false",
    };
  }

  const provider = process.env.EMAIL_PROVIDER || "azure_communication_services";
  if (provider !== "azure_communication_services") {
    return {
      success: false,
      provider: "disabled",
      error: `Unsupported email provider: ${provider}`,
    };
  }

  return sendWithAzureCommunicationServices({
    toEmail: args.toEmail,
    toName: args.toName,
    subject: args.subject,
    textBody: args.textBody,
    htmlBody: args.htmlBody,
    correlationId: args.correlationId,
  });
}

export async function sendInviteEmail(input: InviteEmailInput): Promise<EmailSendResult> {
  const template = buildInviteEmailTemplate({
    recipientName: input.toName,
    temporaryPassword: input.temporaryPassword,
    loginUrl: getLoginUrl(),
  });

  return sendEmail({
    toEmail: input.toEmail,
    toName: input.toName,
    subject: template.subject,
    textBody: template.textBody,
    htmlBody: template.htmlBody,
    correlationId: input.correlationId,
  });
}

export async function sendPasswordResetEmail(input: PasswordEmailInput): Promise<EmailSendResult> {
  const template = buildPasswordEmailTemplate({
    recipientName: input.toName,
    password: input.password,
    loginUrl: getLoginUrl(),
    customPasswordUsed: input.customPasswordUsed,
  });

  return sendEmail({
    toEmail: input.toEmail,
    toName: input.toName,
    subject: template.subject,
    textBody: template.textBody,
    htmlBody: template.htmlBody,
    correlationId: input.correlationId,
  });
}
