# AI Assistant User Guide

## Overview

The AI Assistant is an intelligent feature that helps recruiters query candidate data using natural language. It's available to Platform Admins and Recruiters only.

## Access

- **Available to**: Platform Admins and Recruiters
- **Not available to**: Client Admins, Client Users, and Candidates
- **Feature Flag**: Can be controlled via `FEATURE_AI_ASSISTANT` environment variable

## Features

### Natural Language Queries

Ask questions about your candidate data in plain English:

- "Show me all candidates in Oakland"
- "Find pending candidates for Client A"
- "Who was hired last month?"
- "Show me candidates with status interviewed"

### Filter Suggestions

The AI can suggest filters based on your queries. These filters are automatically validated and applied to your data table.

### CSV Upload Assistance

Upload CSV files via the AI chat interface for guided import assistance.

### User Feedback

Provide feedback on AI responses using the thumbs up/down buttons:
- Click thumbs up for helpful responses
- Click thumbs down for unhelpful responses
- Feedback is automatically submitted to Langfuse for quality tracking

## Usage

### Desktop

1. The AI Assistant panel appears on the right side of the workspace
2. Click the toggle button to open/close the panel
3. Type your question in the input field
4. Press Enter or click Send
5. The AI will respond with an answer and may suggest filters

### Mobile

1. Tap the AI button in the bottom navigation
2. The AI Assistant sheet will slide up from the bottom
3. Type your question and send
4. Swipe down or tap the close button to dismiss

## Common Questions

| Question | Expected Behavior |
|----------|------------------|
| "Show me all candidates in Oakland" | Applies location filter for Oakland |
| "Find pending candidates" | Applies status filter for pending |
| "Who was hired last month?" | Applies status and date range filters |
| "Candidates for Client A" | Applies client filter |
| "How many candidates do I have?" | Returns a count/answer (no filters) |
| "Add a new candidate" | Provides guidance on adding candidates |

## Filter Application

When the AI suggests filters:

1. The filters are automatically validated server-side
2. Valid filters are applied to your data table
3. If some filters are invalid, you'll see a warning message
4. The data table updates to show filtered results

## Error Handling

The AI Assistant provides specific error messages to help you understand what went wrong:

### Rate Limits

If you hit the rate limit (20 requests per minute), you'll see:
> "The AI service is receiving too many requests. Please try again in a moment."

### Configuration Errors

If the AI service is not properly configured (e.g., invalid deployment name, unsupported model parameters):
> "The AI assistant is not configured correctly. Please contact support."

### Input Errors

If your request couldn't be processed:
> "I could not process that request. Try shortening or simplifying what you asked."

### Server Errors

If the AI service encounters a server-side problem:
> "The AI service had a problem answering. Please try again."

### Network Errors

If there's a network connectivity issue:
> "There was a network issue reaching the AI service. Check your connection and try again."

### Access Denied

If you don't have access, you'll see:
> "You do not have access to the AI Assistant"

## Best Practices

1. **Be specific**: More specific queries yield better results
   - ✅ "Show me pending candidates in San Francisco"
   - ❌ "Show me stuff"

2. **Use natural language**: Ask questions as you would to a colleague
   - ✅ "Who was hired last month?"
   - ❌ "status=hired date=last-month"

3. **Check filters**: Review suggested filters before applying
   - The AI may suggest filters you didn't intend
   - You can clear filters manually if needed

4. **Try rephrasing**: If the AI doesn't understand, try a different wording

## Technical Details

### Context Budget

- Maximum 30 candidate rows sent to AI per request
- Only essential fields included: name, location, status, client, date, notes snippet
- Conversation history limited to last 10 turns
- Maximum message length: 3000 characters

### Model Configuration

The AI Assistant automatically adapts to different Azure OpenAI models:

- **Model Detection**: Automatically detects model type from `AZURE_OPENAI_DEPLOYMENT_NAME`
- **Parameter Adaptation**: 
  - Newer models (gpt-5-*, o1-*): Uses `max_completion_tokens` instead of `max_tokens`
  - Models like `gpt-5-nano`: Omits temperature parameter (uses default value of 1)
  - Other models: Uses `temperature: 0.2` and `max_tokens: 800`
- **Request Validation**: Validates deployment name, messages array, and chat options before API calls

### Security

- All queries are tenant-isolated (you only see your own data)
- API keys stored securely in environment variables
- Strict configuration validation on startup and per-request
- Audit logging for all AI interactions with correlation IDs
- Rate limiting prevents abuse (20 requests/minute per user)
- Input sanitization removes dangerous control characters
- PII redaction in audit logs

### Error Classification

Errors are automatically classified into specific types for better debugging:

- **BAD_INPUT**: Invalid request format or content
- **CONFIG_ERROR**: Configuration issues (missing/invalid deployment, unsupported parameters, auth errors)
- **RATE_LIMIT**: Too many requests
- **SERVER_ERROR**: Server-side errors (5xx status codes)
- **NETWORK_ERROR**: Network connectivity or timeout issues
- **UNKNOWN**: Unclassified errors

All errors include structured logging with correlation IDs for debugging.

### Cost Controls

- Token usage logged for monitoring
- Rate limits: 20 requests/minute per user
- Simple pattern matching reduces LLM calls for common queries
- Context budget limits (30 rows max, 10 conversation turns max)

### Langfuse Observability Integration

The AI Assistant is integrated with Langfuse for comprehensive observability, prompt management, and evaluation:

- **Tracing**: All LLM calls are traced with full context, latency, token usage, and costs
- **Prompt Management**: Prompts are versioned and managed in Langfuse (with fallback to hardcoded prompts)
- **Session Tracking**: Conversations are tracked across requests using session IDs
- **User Feedback**: Thumbs up/down buttons on AI responses submit feedback to Langfuse
- **Metadata**: Traces include user role, tenant info, query type, filter suggestions, and candidate context size

**Environment Variables:**
- `LANGFUSE_PUBLIC_KEY`: Public API key from Langfuse Cloud dashboard
- `LANGFUSE_SECRET_KEY`: Secret API key from Langfuse Cloud dashboard
- `LANGFUSE_PROMPT_VERSION`: Optional prompt version pinning (defaults to "latest")
- `LANGFUSE_HOST`: Optional custom host (defaults to https://cloud.langfuse.com)

**Setup:**
1. Sign up for free Langfuse Cloud account at https://cloud.langfuse.com
2. Create a project in Langfuse dashboard
3. Generate API keys (Public Key and Secret Key)
4. Add keys to environment variables
5. Create prompts in Langfuse UI:
   - `candidate-query-prompt`: Main candidate query assistant prompt
   - `csv-assist-prompt`: CSV import assistance prompt

**Graceful Degradation:**
- If Langfuse is not configured, the system falls back to hardcoded prompts
- All functionality works without Langfuse, but observability features are disabled
- No errors are thrown if Langfuse is unavailable

## Troubleshooting

### AI Assistant Not Showing

1. Check your role: Only Platform Admins and Recruiters have access
2. Check feature flag: Ensure `FEATURE_AI_ASSISTANT` is not set to "false"
3. Refresh the page

### Filters Not Applying

1. Check for warning messages
2. Some filters may be invalid and were rejected
3. Try rephrasing your query

### Slow Responses

1. The AI may take a few seconds to process complex queries (typically 2-5 seconds)
2. Check your internet connection
3. Try a simpler query
4. Check server logs using the correlation ID if provided in error messages

### Configuration Errors

If you see "The AI assistant is not configured correctly":
1. Check that `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_API_KEY` are set correctly
2. Verify the endpoint is not using placeholder values
3. Ensure `AZURE_OPENAI_DEPLOYMENT_NAME` matches your Azure deployment
4. Check server logs for detailed configuration error messages
5. Contact your system administrator with the correlation ID from the error

## For Developers

### Adding New AI Capabilities

1. **Extend `AiAssistantResult` interface** if needed:
   ```typescript
   export interface AiAssistantResult {
     message: string;
     filters?: FilterState;
     insights?: string[];
     warnings?: string[]; // For partial filter acceptance
     csvAssist?: {
       phase: "analysis" | "mapping" | "validation" | "complete";
       issues?: string[];
     };
     // Add new nested objects here
   }
   ```

2. **Update prompts**:
   - If Langfuse is configured: Create/update prompts in Langfuse UI
   - Fallback prompts: Update `FALLBACK_PROMPTS` in `src/lib/ai-service.ts`
   ```typescript
   const FALLBACK_PROMPTS = {
     candidateQuery: `...`,
     // Add new prompt templates
   };
   ```

3. **Add tests** for the new behavior in `src/__tests__/unit/ai-service.test.ts`

### Architecture Overview

- **`azure-openai-client.ts`**: Shared Azure OpenAI client configuration with strict validation
  - `validateAzureConfig()`: Checks for required env vars and placeholder values
  - `ensureAzureConfig()`: Validates config before API calls
  - Throws `ConfigurationError` for invalid configurations
- **`ai-service.ts`**: All LLM calls centralized here
  - `chatWithContext()`: Main function for AI interactions (with Langfuse tracing)
  - `processCSVWithAI()`: CSV analysis with Langfuse tracing
  - `getPrompt()`: Fetches prompts from Langfuse or falls back to hardcoded
  - `classifyAIError()`: Categorizes errors into specific types
  - `getErrorMessage()`: Returns user-friendly error messages
  - `getChatOptions()`: Adapts parameters based on model type
  - `validateChatRequest()`: Validates requests before sending to Azure
- **`langfuse-client.ts`**: Langfuse client wrapper
  - `getLangfuseClient()`: Returns Langfuse client instance or null
  - `isLangfuseAvailable()`: Checks if Langfuse is configured
  - `flushLangfuse()`: Flushes pending events (important for serverless)
- **`/api/ai/feedback`**: User feedback endpoint
  - Accepts feedback scores (0 or 1) and optional comments
  - Submits to Langfuse for quality tracking
  - Logs to audit system
- **`ai-query-parser.ts`**: Pure filter validation (no LLM calls)
- **`/api/ai/chat`**: Main API endpoint with auth, RBAC, tenant isolation
  - Generates correlation IDs for request tracking
  - Structured error logging with `[AI_SERVICE_ERROR]` and `[AI_CHAT]` prefixes
  - Logs AI service errors when generic error messages are returned
- **`errors.ts`**: Custom error types (`ConfigurationError`)

### Security Guidelines

- **Role-based access**: Enforced at API route level (Platform Admins and Recruiters only)
- **Feature flag**: Controlled via `FEATURE_AI_ASSISTANT` environment variable
- **Tenant isolation**: All queries use `tenantWhere(user)` at DB layer
- **Input validation**: 
  - Messages sanitized (control characters removed)
  - Length-limited to 3000 characters
  - Empty messages rejected
- **Configuration validation**: 
  - Strict validation of Azure OpenAI endpoint and API key
  - Checks for placeholder values
  - Validates deployment name and model parameters
- **Filter validation**: AI suggestions always validated server-side
- **Audit logging**: 
  - All interactions logged with correlation IDs
  - PII redacted in logs (emails, phones replaced with placeholders)
  - Structured logging with error types and details
- **Error handling**: 
  - Structured error logging with full error details
  - Correlation IDs included in all error responses
  - User-friendly error messages (no sensitive data exposed)

## Support

For issues or questions:
1. Check this documentation
2. Review error messages in the UI
3. Contact your system administrator
4. Check audit logs for detailed error information
