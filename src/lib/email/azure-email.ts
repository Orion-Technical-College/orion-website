import { EmailClient } from "@azure/communication-email";
import type { EmailPayload, EmailSendResult } from "./types";

let client: EmailClient | null = null;

function getClient() {
  if (client) {
    return client;
  }

  const connectionString = process.env.ACS_EMAIL_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error("ACS_EMAIL_CONNECTION_STRING is not configured");
  }

  client = new EmailClient(connectionString);
  return client;
}

export async function sendWithAzureCommunicationServices(
  payload: EmailPayload
): Promise<EmailSendResult> {
  const senderAddress = process.env.ACS_EMAIL_SENDER_ADDRESS;
  if (!senderAddress) {
    return {
      success: false,
      provider: "azure_communication_services",
      error: "ACS_EMAIL_SENDER_ADDRESS is not configured",
    };
  }

  try {
    const emailClient = getClient();
    const poller = await emailClient.beginSend({
      senderAddress,
      recipients: {
        to: [
          {
            address: payload.toEmail,
            displayName: payload.toName || undefined,
          },
        ],
      },
      content: {
        subject: payload.subject,
        plainText: payload.textBody,
        html: payload.htmlBody,
      },
    });

    const result = await poller.pollUntilDone();
    const status = (result as { status?: string } | undefined)?.status;
    if (status && status !== "Succeeded") {
      return {
        success: false,
        provider: "azure_communication_services",
        error: `Azure email send failed with status ${status}`,
      };
    }

    return {
      success: true,
      provider: "azure_communication_services",
      messageId: (result as { id?: string } | undefined)?.id,
    };
  } catch (error: any) {
    return {
      success: false,
      provider: "azure_communication_services",
      error: error?.message || "Unknown Azure email error",
    };
  }
}
