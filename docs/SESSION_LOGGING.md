# Session Drop Diagnostic Logging

This document describes the `SESSION_MISSING` auth event used to diagnose intermittent session drops (e.g. users sent to login unexpectedly, especially on mobile with WiFi off).

## Event: SESSION_MISSING

When the app treats the user as unauthenticated and redirects or responds with 401, we log a structured event so you can see **where** it happened:

| Source | Meaning |
|--------|--------|
| `middleware` | No token on protected route; NextAuth middleware redirected to sign-in. Often means cookie missing or not sent (e.g. after app switch). |
| `server` | `getServerSession()` returned null or invalid role (e.g. in WorkspaceShell). Cookie not in request or JWT invalid/expired. |
| `client` | A client page (workspaces, recruiter, emc, marketing) saw `useSession().status === "unauthenticated"` after loading and redirected to login. Often a failed or timed-out session check on slow/cellular networks. |
| `api` | An API route returned 401 because session was missing (e.g. guided send PATCH after returning from SMS app). |

No PII (userId/email) is logged for SESSION_MISSING, since we have no session when it fires.

## Where we log it

- **Middleware** ([src/middleware.ts](../src/middleware.ts)): when `authorized` returns false (no token), with `path`.
- **Server** ([src/lib/auth.ts](../src/lib/auth.ts) `getCurrentUser`): when session or user is null, or role is invalid.
- **Client pages** ([src/app/workspaces/page.tsx](../src/app/workspaces/page.tsx), recruiter, emc, marketing): just before `router.push("/login")`, with `path` = page name (e.g. `workspaces`, `recruiter`).
- **API routes** (e.g. [src/app/api/workspaces/route.ts](../src/app/api/workspaces/route.ts), sessions/recipients): when using `getSessionOr401(routeTag)`, with `route` = route tag.

Guided send also logs client-side when a request returns 401: `[GUIDED_SEND] Request returned 401` with `action` and `sessionId` for correlation with server logs.

## How to search logs

### Local

- Console output: grep for `SESSION_MISSING` or `[Auth]`.

### Vercel

- Dashboard → Project → Logs (Runtime Logs); filter by message or deployment for `SESSION_MISSING` or `[Auth]`.

### Azure

- **App Service Log stream:** Azure Portal → App Service → Monitoring → Log stream. Enable "Application Logging (Filesystem)" or "Log stream" if needed. Search the stream for `SESSION_MISSING` or `[Auth]`.
- **Application Insights (Log Analytics):** If the app is configured with Application Insights, auth events (including `SESSION_MISSING`) are sent as custom events when `APPLICATIONINSIGHTS_CONNECTION_STRING` or `APPINSIGHTS_INSTRUMENTATIONKEY` is set. The optional dependency `applicationinsights` is used; install with `npm install applicationinsights` if not already present. Example KQL:
  ```kusto
  customEvents
  | where name == "SESSION_MISSING"
  | project timestamp, customDimensions.source, customDimensions.path, customDimensions.route, customDimensions.message
  | order by timestamp desc
  ```

## Mobile / cellular (WiFi off)

When the report is "session dropped on mobile with WiFi off", look for `SESSION_MISSING` with `source=client` or `source=api`. That often indicates a timeout or network failure rather than an explicit logout (e.g. session check or API call failed on slow cellular, or after returning from the native SMS app).

## Resolution strategy

1. **Diagnose with logs** – When a user reports a drop, search logs for `SESSION_MISSING` (and optionally `[GUIDED_SEND] Request returned 401`) around the reported time. Use `source` and `path`/`route` to see where it happened (middleware vs server vs client vs API).

2. **Guided send (mobile + SMS app switch)** – The app now **retries once on 401** for guided-send API calls (load session, PATCH recipient). After a 401, it calls `getSession()` to refresh the client session, then retries the request. That reduces spurious logouts when the session is still valid but the cookie wasn’t sent on the first request (e.g. after returning from the native Messages app on cellular). See [guided-send.tsx](../src/components/campaigns/guided-send.tsx) `fetchWithRetryOn401`.

3. **If drops continue** – If `source=api` and route is sessions/recipients, the retry may still be failing (session truly invalid or cookie not sent even after refresh). Consider reviewing cookie `SameSite`/`Secure` and domain for the production host. If `source=client`, consider adding a single session refetch (or short delay) before redirecting to login on protected pages so a slow cellular response doesn’t trigger an immediate redirect.
