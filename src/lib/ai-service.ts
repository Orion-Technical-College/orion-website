import { azureOpenAI } from "./azure-openai-client";
import { getLangfuseClient } from "./langfuse-client";
import type { FilterState } from "./filtering";
import type { Candidate } from "@/types";
import type { Message } from "@/types";

/**
 * Canonical contract for all AI features.
 * All AI responses must conform to this interface.
 */
export interface AiAssistantResult {
  message: string;
  filters?: FilterState;
  insights?: string[];
  warnings?: string[]; // For partial filter acceptance
  csvAssist?: {
    phase: "analysis" | "mapping" | "validation" | "complete";
    issues?: string[];
  };
  // Future: analytics, campaign suggestions, etc. as nested objects
}

/**
 * Context budget enforcement constants
 */
export const MAX_ROWS = 30;
export const MAX_HISTORY_TURNS = 10;
export const MAX_MESSAGE_CHARS = 3000;

/**
 * Get the deployment name from environment or default
 */
function getDeploymentName(): string {
  return process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o";
}

/**
 * Check if model requires max_completion_tokens instead of max_tokens
 * Newer models (gpt-5-*, o1-*, etc.) use max_completion_tokens
 */
function requiresMaxCompletionTokens(deploymentName: string): boolean {
  const lower = deploymentName.toLowerCase();
  return lower.startsWith('gpt-5') || lower.startsWith('o1');
}

/**
 * Check if model is a reasoning model (uses reasoning tokens)
 * Reasoning models need higher token limits to account for both reasoning and output
 */
function isReasoningModel(deploymentName: string): boolean {
  const lower = deploymentName.toLowerCase();
  // Models that use reasoning tokens (thinking process)
  return lower.includes('gpt-5') || lower.includes('o1');
}

/**
 * Check if model supports custom temperature values
 * Some models (e.g., gpt-5-nano) only support the default temperature of 1
 */
function supportsCustomTemperature(deploymentName: string): boolean {
  const lower = deploymentName.toLowerCase();
  // Models that don't support custom temperature
  if (lower.includes('gpt-5-nano')) {
    return false;
  }
  // Most models support custom temperature
  return true;
}

/**
 * Standardized model options for consistency
 * Adapts to model requirements (max_tokens vs max_completion_tokens, temperature support)
 */
function getChatOptions(deploymentName: string) {
  const baseOptions: { temperature?: number; max_tokens?: number; max_completion_tokens?: number } = {};

  // Only include temperature if the model supports it
  if (supportsCustomTemperature(deploymentName)) {
    baseOptions.temperature = 0.2;
  }

  if (requiresMaxCompletionTokens(deploymentName)) {
    // Reasoning models need more tokens: reasoning tokens + output tokens
    // For reasoning models, allocate more tokens to ensure we get actual output
    const maxCompletionTokens = isReasoningModel(deploymentName) ? 4000 : 800;
    return {
      ...baseOptions,
      max_completion_tokens: maxCompletionTokens,
    };
  } else {
    return {
      ...baseOptions,
      max_tokens: 800,
    };
  }
}

/**
 * AI error types for user-friendly error messages
 */
export type AIErrorType = "BAD_INPUT" | "CONFIG_ERROR" | "RATE_LIMIT" | "SERVER_ERROR" | "NETWORK_ERROR" | "UNKNOWN";

/**
 * Fallback prompt templates (used when Langfuse is unavailable)
 */
const FALLBACK_PROMPTS = {
  candidateQuery: `You are an AI assistant helping recruiters query candidate data in EMC Workspace.

Your role:
- Understand natural language queries about candidates
- Suggest appropriate filters based on the query
- Provide helpful insights about the data
- Be concise and actionable

When suggesting filters, include a JSON object in your response with this exact format:
{
  "filters": {
    "status": ["pending", "hired"],
    "clients": ["Client A"],
    "locations": ["Oakland, CA"],
    "sources": ["Indeed"],
    "dateRange": {"start": "2025-01-01", "end": "2025-01-31"},
    "search": "keyword"
  }
}

Only include filter fields that are relevant to the query. Use empty arrays for multi-select filters when not applicable.
Status values must be lowercase: "pending", "interviewed", "hired", "denied", "consent-form-sent"

Candidate fields available:
- name, email, phone
- status: pending, interviewed, hired, denied, consent-form-sent
- client, source, location, jobTitle
- date (string format, ISO dates preferred)
- notes

Provide a natural language response first, then include the filters JSON if applicable.`,

  csvAssist: `You are an AI assistant helping with CSV import in EMC Workspace.

Your role:
- Analyze CSV structure and headers
- Suggest column mappings to candidate fields
- Guide users through the import process
- Identify potential data quality issues

Be conversational and helpful. Guide users step by step.`,
};

/**
 * Get prompt from Langfuse or fallback to hardcoded
 */
async function getPrompt(promptName: string): Promise<string> {
  const langfuse = getLangfuseClient();

  if (langfuse) {
    try {
      const promptVersion = process.env.LANGFUSE_PROMPT_VERSION || "latest";
      const version = promptVersion === "latest" ? undefined : parseInt(promptVersion);
      const prompt = await langfuse.getPrompt(promptName, version);
      if (prompt && typeof prompt === "string") {
        return prompt;
      }
      // Handle prompt object format if returned
      if (prompt && typeof prompt === "object" && "prompt" in prompt) {
        return (prompt as { prompt: string }).prompt;
      }
    } catch (error) {
      console.warn(`[LANGFUSE] Failed to fetch prompt "${promptName}", using fallback:`, error);
    }
  }

  // Fallback to hardcoded prompts
  // Map Langfuse prompt names to fallback keys
  const promptNameMap: Record<string, keyof typeof FALLBACK_PROMPTS> = {
    "candidate-query-prompt": "candidateQuery",
    "csv-assist-prompt": "csvAssist",
  };

  const fallbackKey = promptNameMap[promptName] || promptName as keyof typeof FALLBACK_PROMPTS;
  const fallbackPrompt = FALLBACK_PROMPTS[fallbackKey];

  if (fallbackPrompt) {
    return fallbackPrompt;
  }

  throw new Error(`Prompt "${promptName}" not found in Langfuse or fallback prompts`);
}

/**
 * Trim conversation history to last N turns
 */
export function trimHistory(history: Message[]): Message[] {
  if (history.length <= MAX_HISTORY_TURNS) {
    return history;
  }
  return history.slice(-MAX_HISTORY_TURNS);
}

/**
 * Select a sample of candidates for context (max MAX_ROWS)
 * Include only essential fields: name, location, status, client, date, short notes snippet
 */
export function selectCandidateSample(candidates: Candidate[]): Candidate[] {
  const sample = candidates.slice(0, MAX_ROWS);
  // Return only essential fields for context
  return sample.map((c) => ({
    id: c.id,
    name: c.name,
    location: c.location,
    status: c.status,
    client: c.client,
    date: c.date,
    notes: c.notes ? c.notes.substring(0, 100) : "", // Short snippet
    email: c.email,
    phone: c.phone,
    source: c.source,
    jobTitle: c.jobTitle,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
}

/**
 * Sanitize message: trim and strip dangerous control characters
 */
export function sanitizeMessage(message: string): string {
  if (message.length > MAX_MESSAGE_CHARS) {
    message = message.substring(0, MAX_MESSAGE_CHARS);
  }
  // Remove control characters except newlines and tabs
  return message.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "").trim();
}

/**
 * Validate chat request before sending to Azure OpenAI
 */
function validateChatRequest(
  deploymentName: string,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>
): void {
  if (!deploymentName || deploymentName.trim().length === 0) {
    throw new Error("Missing AZURE_OPENAI_DEPLOYMENT_NAME");
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("Empty messages array");
  }
  // Check for both max_tokens and max_completion_tokens (shouldn't happen, but validate)
  const chatOptions = getChatOptions(deploymentName) as { max_tokens?: number; max_completion_tokens?: number; temperature?: number };
  if (chatOptions.max_tokens && chatOptions.max_completion_tokens) {
    throw new Error("Invalid chat options: cannot use both max_tokens and max_completion_tokens");
  }
}

/**
 * Classify AI errors into user-friendly categories
 */
export function classifyAIError(error: {
  message?: string;
  status?: number;
  code?: string;
  param?: string;
  response?: { status?: number; data?: any };
}): AIErrorType {
  const status = error.status ?? error.response?.status;
  const msg = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();
  const param = (error.param ?? "").toLowerCase();

  // Configuration issues: wrong deployment name, missing env, unsupported parameters, etc.
  if (
    msg.includes("deployment") ||
    msg.includes("model_not_found") ||
    msg.includes("not found") ||
    (code === "unsupported_value" && (param === "temperature" || msg.includes("temperature") || msg.includes("does not support")))
  ) {
    return "CONFIG_ERROR";
  }

  // Authentication/authorization
  if (status === 401 || status === 403 || code === "invalid_api_key") {
    return "CONFIG_ERROR";
  }

  // Rate limiting
  if (status === 429 || code === "rate_limit_exceeded" || msg.includes("rate limit")) {
    return "RATE_LIMIT";
  }

  // Server errors
  if (status && status >= 500) {
    return "SERVER_ERROR";
  }

  // Network/timeout errors
  if (msg.includes("network error") || msg.includes("timeout") || msg.includes("connection")) {
    return "NETWORK_ERROR";
  }

  // Classic invalid request payload
  if (status === 400 || msg.includes("invalid request") || msg.includes("bad request")) {
    return "BAD_INPUT";
  }

  return "UNKNOWN";
}

/**
 * Get user-friendly error message from error type
 */
export function getErrorMessage(errorType: AIErrorType): string {
  switch (errorType) {
    case "BAD_INPUT":
      return "I could not process that request. Try shortening or simplifying what you asked.";
    case "CONFIG_ERROR":
      return "The AI assistant is not configured correctly. Please contact support.";
    case "RATE_LIMIT":
      return "The AI service is receiving too many requests. Please try again in a moment.";
    case "SERVER_ERROR":
      return "The AI service had a problem answering. Please try again.";
    case "NETWORK_ERROR":
      return "There was a network issue reaching the AI service. Check your connection and try again.";
    default:
      return "Something went wrong while talking to the AI service.";
  }
}

/**
 * Chat with context - main function for AI interactions
 * Returns AiAssistantResult with message and optional filters/insights
 */
export interface ChatWithContextResult extends AiAssistantResult {
  traceId?: string; // Langfuse trace ID for feedback linking
}

export async function chatWithContext(
  userMessage: string,
  conversationHistory: Message[] = [],
  candidateContext: Candidate[] = [],
  userRole?: string,
  clientId?: string | null,
  metadata?: {
    correlationId?: string;
    userId?: string;
    sessionId?: string;
    traceId?: string;
  }
): Promise<ChatWithContextResult> {
  try {
    // Sanitize input
    const sanitizedMessage = sanitizeMessage(userMessage);
    if (!sanitizedMessage) {
      return {
        message: "Please provide a valid message.",
      };
    }

    // Trim history
    const trimmedHistory = trimHistory(conversationHistory);

    // Select candidate sample for context
    const candidateSample = selectCandidateSample(candidateContext);

    // Build system prompt with tenant context (for awareness only, not for isolation)
    // Fetch prompt from Langfuse or use fallback
    let systemPrompt = await getPrompt("candidate-query-prompt");
    if (userRole) {
      systemPrompt += `\n\nUser role: ${userRole}`;
    }
    if (clientId) {
      systemPrompt += `\n\nUser's client scope: ${clientId}`;
    }

    // Build messages array
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history
    for (const msg of trimmedHistory) {
      messages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      });
    }

    // Add candidate context if available
    if (candidateSample.length > 0) {
      const contextSummary = `Here are ${candidateSample.length} candidate records for context:\n${JSON.stringify(candidateSample, null, 2)}`;
      messages.push({
        role: "user",
        content: `Context: ${contextSummary}\n\nUser query: ${sanitizedMessage}`,
      });
    } else {
      messages.push({ role: "user", content: sanitizedMessage });
    }

    // Get deployment name and options
    const deploymentName = getDeploymentName();
    const chatOptions = getChatOptions(deploymentName);

    // Validate before calling Azure
    validateChatRequest(deploymentName, messages);

    // Initialize Langfuse tracing
    const langfuse = getLangfuseClient();
    let trace = null;
    let generation = null;
    let traceId: string | undefined = undefined;

    if (langfuse) {
      try {
        trace = langfuse.trace({
          name: "ai-chat-candidate-query",
          userId: metadata?.userId,
          sessionId: metadata?.sessionId,
          input: sanitizedMessage, // User's message for trace-level visibility
          metadata: {
            correlationId: metadata?.correlationId,
            userRole,
            clientId,
            candidateContextSize: candidateContext.length,
            conversationHistoryLength: conversationHistory.length,
            deploymentName,
            hasCandidateContext: candidateContext.length > 0,
          },
          ...(metadata?.traceId && { id: metadata.traceId }),
        });

        // Capture traceId for return value
        // Langfuse trace objects have an id property that is the traceId
        traceId = (trace as any)?.id || metadata?.traceId;

        generation = trace.generation({
          name: "azure-openai-chat",
          model: deploymentName,
          modelParameters: {
            temperature: chatOptions.temperature,
            max_tokens: chatOptions.max_tokens,
            max_completion_tokens: chatOptions.max_completion_tokens,
          },
          input: messages,
        });
      } catch (langfuseError) {
        console.error("[LANGFUSE] Failed to create trace:", langfuseError);
        // Continue without tracing
      }
    }

    // Call Azure OpenAI
    const response = await azureOpenAI.chat.completions.create({
      model: deploymentName, // Use deployment name as model identifier
      messages,
      ...chatOptions,
    });

    // Log response structure for debugging
    if (!response.choices || response.choices.length === 0) {
      console.error("[AI_SERVICE] Empty choices array in response:", {
        response: JSON.stringify(response, null, 2),
        correlationId: metadata?.correlationId,
      });
    }

    const aiResponse = response.choices[0]?.message?.content;

    // Log if response content is empty
    if (!aiResponse || aiResponse.trim().length === 0) {
      console.warn("[AI_SERVICE] Empty or missing content in response:", {
        hasChoices: !!response.choices && response.choices.length > 0,
        choiceCount: response.choices?.length || 0,
        firstChoice: response.choices?.[0] ? {
          finishReason: response.choices[0].finish_reason,
          messageRole: response.choices[0].message?.role,
          hasContent: !!response.choices[0].message?.content,
          contentLength: response.choices[0].message?.content?.length || 0,
        } : null,
        usage: response.usage,
        correlationId: metadata?.correlationId,
        deploymentName,
      });
    }

    const finalResponse = aiResponse || "I'm sorry, I couldn't generate a response.";

    // Try to extract structured data from response (filters, insights)
    let suggestedFilters: FilterState | undefined;
    let messageText = finalResponse;

    try {
      // Look for JSON object in the response (could be anywhere in the text)
      const jsonMatch = finalResponse.match(/\{[\s\S]*"filters"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.filters) {
          suggestedFilters = parsed.filters;
          // Remove the JSON from the message text for cleaner display
          messageText = finalResponse.replace(jsonMatch[0], "").trim();
        }
      }
    } catch (error) {
      // If JSON parsing fails, just use the text response
      console.debug("Could not parse filters from AI response:", error);
    }

    // Update Langfuse generation and trace with response
    if (generation) {
      try {
        generation.end({
          output: finalResponse, // Full response for debugging (includes any JSON)
          usage: {
            promptTokens: response.usage?.prompt_tokens,
            completionTokens: response.usage?.completion_tokens,
            totalTokens: response.usage?.total_tokens,
          },
          metadata: {
            finishReason: response.choices[0]?.finish_reason,
            isEmpty: !aiResponse || aiResponse.trim().length === 0,
          },
        });
      } catch (langfuseError) {
        console.error("[LANGFUSE] Failed to update generation:", langfuseError);
      }
    }

    // Update trace with final result (use cleaned messageText that user sees)
    if (trace) {
      try {
        trace.update({
          output: messageText, // Use cleaned message text (what user actually sees)
          metadata: {
            ...trace.metadata,
            hasFilters: !!suggestedFilters,
            filterKeys: suggestedFilters ? Object.keys(suggestedFilters) : [],
          },
        });
      } catch (langfuseError) {
        console.error("[LANGFUSE] Failed to update trace metadata:", langfuseError);
      }
    }

    return {
      message: messageText || finalResponse,
      filters: suggestedFilters,
      traceId, // Return traceId for feedback linking
    };
  } catch (error) {
    const errorDetails = error as {
      name?: string;
      message?: string;
      status?: number;
      code?: string;
      param?: string;
      stack?: string;
      response?: { status?: number; data?: any };
    };

    const errorType = classifyAIError(errorDetails);
    const errorMessage = getErrorMessage(errorType);

    // Log error to Langfuse if available
    const langfuse = getLangfuseClient();
    if (langfuse) {
      try {
        const trace = langfuse.trace({
          name: "ai-chat-candidate-query",
          userId: metadata?.userId,
          sessionId: metadata?.sessionId,
          input: userMessage, // User's original message
          output: errorMessage, // Error message shown to user
          metadata: {
            correlationId: metadata?.correlationId,
            userRole,
            clientId,
            error: true,
            errorType,
            errorMessage: errorDetails.message,
            errorStatus: errorDetails.status ?? errorDetails.response?.status,
          },
          ...(metadata?.traceId && { id: metadata.traceId }),
        });

        trace.event({
          name: "error",
          input: errorDetails.message,
          metadata: {
            errorType,
            status: errorDetails.status ?? errorDetails.response?.status,
            code: errorDetails.code,
          },
        });
      } catch (langfuseError) {
        console.error("[LANGFUSE] Failed to log error:", langfuseError);
      }
    }

    console.error("[AI_SERVICE_ERROR]", {
      errorType,
      name: errorDetails.name,
      message: errorDetails.message,
      status: errorDetails.status ?? errorDetails.response?.status,
      code: errorDetails.code,
      response: errorDetails.response?.data,
      stack: errorDetails.stack,
      deploymentName: getDeploymentName(),
    });

    return {
      message: errorMessage,
    };
  }
}

/**
 * Generate data insights from candidate data
 */
export async function generateDataInsights(
  candidates: Candidate[],
  userRole?: string
): Promise<string[]> {
  try {
    const sample = selectCandidateSample(candidates);
    const systemPrompt = `You are an AI assistant analyzing candidate data. Provide 3-5 concise insights about the data. Focus on patterns, trends, and actionable recommendations.`;

    const deploymentName = getDeploymentName();
    const chatOptions = getChatOptions(deploymentName);

    const response = await azureOpenAI.chat.completions.create({
      model: deploymentName,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Analyze this candidate data and provide insights:\n${JSON.stringify(sample, null, 2)}`,
        },
      ],
      ...chatOptions,
    });

    const insightsText = response.choices[0]?.message?.content || "";
    // Split insights by newlines or bullets
    const insights = insightsText
      .split(/\n|•|-/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 5);

    return insights;
  } catch (error) {
    console.error("Error generating insights:", error);
    return [];
  }
}

/**
 * Process CSV with AI assistance
 * This will be expanded when CSV upload endpoint is implemented
 */
export async function processCSVWithAI(
  csvHeaders: string[],
  sampleRows: string[][],
  userMessage?: string,
  metadata?: {
    correlationId?: string;
    userId?: string;
    sessionId?: string;
    traceId?: string;
  }
): Promise<AiAssistantResult> {
  try {
    // Fetch prompt from Langfuse or use fallback
    const systemPrompt = await getPrompt("csv-assist-prompt");

    const userPrompt = userMessage || "Analyze this CSV structure and suggest column mappings.";

    const deploymentName = getDeploymentName();
    const chatOptions = getChatOptions(deploymentName);

    const messages = [
      { role: "system" as const, content: systemPrompt },
      {
        role: "user" as const,
        content: `${userPrompt}\n\nHeaders: ${csvHeaders.join(", ")}\n\nSample rows:\n${JSON.stringify(sampleRows.slice(0, 5), null, 2)}`,
      },
    ];

    // Initialize Langfuse tracing
    const langfuse = getLangfuseClient();
    let trace = null;
    let generation = null;

    if (langfuse) {
      try {
        trace = langfuse.trace({
          name: "ai-csv-assist",
          userId: metadata?.userId,
          sessionId: metadata?.sessionId,
          input: userPrompt, // User's message or default prompt
          metadata: {
            correlationId: metadata?.correlationId,
            csvHeadersCount: csvHeaders.length,
            sampleRowsCount: sampleRows.length,
            deploymentName,
          },
          ...(metadata?.traceId && { id: metadata.traceId }),
        });

        generation = trace.generation({
          name: "azure-openai-csv-analysis",
          model: deploymentName,
          modelParameters: {
            temperature: chatOptions.temperature,
            max_tokens: chatOptions.max_tokens,
            max_completion_tokens: chatOptions.max_completion_tokens,
          },
          input: messages,
        });
      } catch (langfuseError) {
        console.error("[LANGFUSE] Failed to create trace:", langfuseError);
      }
    }

    const response = await azureOpenAI.chat.completions.create({
      model: deploymentName,
      messages,
      ...chatOptions,
    });

    const message = response.choices[0]?.message?.content || "I've analyzed your CSV file.";

    // Update Langfuse generation with response
    if (generation) {
      try {
        generation.end({
          output: message,
          usage: {
            promptTokens: response.usage?.prompt_tokens,
            completionTokens: response.usage?.completion_tokens,
            totalTokens: response.usage?.total_tokens,
          },
        });
        if (trace) {
          trace.update({
            output: message,
          });
        }
      } catch (langfuseError) {
        console.error("[LANGFUSE] Failed to update generation:", langfuseError);
      }
    }

    return {
      message,
      csvAssist: {
        phase: "analysis",
      },
    };
  } catch (error) {
    const errorDetails = error as {
      name?: string;
      message?: string;
      status?: number;
      code?: string;
      response?: { status?: number; data?: any };
    };
    const errorType = classifyAIError(errorDetails);
    const errorMessage = getErrorMessage(errorType);

    // Log error to Langfuse if available
    const langfuse = getLangfuseClient();
    if (langfuse) {
      try {
        const trace = langfuse.trace({
          name: "ai-csv-assist",
          userId: metadata?.userId,
          sessionId: metadata?.sessionId,
          input: userMessage || "Analyze CSV structure", // User's message or default
          output: errorMessage, // Error message shown to user
          metadata: {
            correlationId: metadata?.correlationId,
            error: true,
            errorType,
            errorMessage: errorDetails.message,
            errorStatus: errorDetails.status ?? errorDetails.response?.status,
          },
          ...(metadata?.traceId && { id: metadata.traceId }),
        });

        trace.event({
          name: "error",
          input: errorDetails.message,
          metadata: {
            errorType,
            status: errorDetails.status ?? errorDetails.response?.status,
            code: errorDetails.code,
          },
        });
      } catch (langfuseError) {
        console.error("[LANGFUSE] Failed to log error:", langfuseError);
      }
    }

    console.error("[AI_SERVICE_ERROR][CSV]", {
      errorType,
      name: errorDetails.name,
      message: errorDetails.message,
      status: errorDetails.status ?? errorDetails.response?.status,
    });

    return {
      message: errorMessage,
      csvAssist: {
        phase: "analysis",
        issues: [errorMessage],
      },
    };
  }
}

/**
 * Draft SMS message using AI
 * Returns structured JSON output with validation
 */
export interface SmsDraftResult {
  message: string;
  alternate?: string;
  length: number;
  mustInclude: {
    zoomLink: boolean;
    date: boolean;
    time: boolean;
  };
}

export async function draftSmsMessage(
  eventType: string,
  variables: Record<string, string>,
  constraints?: { maxLength?: number }
): Promise<SmsDraftResult> {
  const maxLength = constraints?.maxLength || 320;

  const systemPrompt = `You are an expert SMS message writer. Create concise, professional SMS messages for candidate outreach.

Requirements:
- Keep messages under ${maxLength} characters
- Use plain text only (no markdown, no formatting)
- Be friendly and professional
- Include all required information exactly as provided
- Do not invent or hallucinate any details

You must return a JSON object with this exact structure:
{
  "message": "the main SMS message",
  "alternate": "an alternative version with different tone (optional)",
  "length": number of characters in message,
  "mustInclude": {
    "zoomLink": true/false (whether zoom link was included),
    "date": true/false (whether date was included),
    "time": true/false (whether time was included)
  }
}`;

  const userPrompt = `Create an SMS message for: ${eventType}

Variables provided:
${JSON.stringify(variables, null, 2)}

Requirements:
- Include the exact zoom link if provided: ${variables.zoomLink || "N/A"}
- Include the exact date if provided: ${variables.date || "N/A"}
- Include the exact time if provided: ${variables.time || "N/A"}
- Do NOT invent any details not provided
- Keep under ${maxLength} characters`;

  const deploymentName = getDeploymentName();
  const chatOptions = getChatOptions(deploymentName);

  const messages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: userPrompt },
  ];

  try {
    const response = await azureOpenAI.chat.completions.create({
      model: deploymentName,
      messages,
      ...chatOptions,
      response_format: { type: "json_object" }, // Force JSON output
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from AI");
    }

    // Parse JSON response
    let draft: SmsDraftResult;
    try {
      draft = JSON.parse(content);
    } catch (parseError) {
      throw new Error("Failed to parse AI response as JSON");
    }

    // Validate structure
    if (!draft.message || typeof draft.message !== "string") {
      throw new Error("Invalid draft structure: message is required");
    }

    // Server-side validation
    const zoomLinkProvided = variables.zoomLink && variables.zoomLink !== "N/A";
    const dateProvided = variables.date && variables.date !== "N/A";
    const timeProvided = variables.time && variables.time !== "N/A";

    // Validate mustInclude flags match provided variables
    if (zoomLinkProvided && !draft.mustInclude?.zoomLink) {
      console.warn("[AI_DRAFT] Zoom link provided but not included in draft");
    }
    if (dateProvided && !draft.mustInclude?.date) {
      console.warn("[AI_DRAFT] Date provided but not included in draft");
    }
    if (timeProvided && !draft.mustInclude?.time) {
      console.warn("[AI_DRAFT] Time provided but not included in draft");
    }

    // Validate exact matches (no hallucination)
    if (zoomLinkProvided && !draft.message.includes(variables.zoomLink)) {
      throw new Error("Draft does not include the provided zoom link");
    }
    if (dateProvided && !draft.message.includes(variables.date)) {
      throw new Error("Draft does not include the provided date");
    }
    if (timeProvided && !draft.message.includes(variables.time)) {
      throw new Error("Draft does not include the provided time");
    }

    // Validate length
    if (draft.length > maxLength) {
      throw new Error(`Draft exceeds maximum length of ${maxLength} characters`);
    }

    // Ensure mustInclude structure exists
    draft.mustInclude = {
      zoomLink: draft.mustInclude?.zoomLink || false,
      date: draft.mustInclude?.date || false,
      time: draft.mustInclude?.time || false,
    };

    return draft;
  } catch (error: any) {
    console.error("[AI_DRAFT] Error:", error);
    throw new Error(`Failed to draft SMS message: ${error.message}`);
  }
}
