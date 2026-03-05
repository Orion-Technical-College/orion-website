/**
 * Application Insights sink for auth events. Import this only from server-side code
 * (e.g. auth.ts) so the applicationinsights package is not bundled for the client.
 */

import type { AuthLogEntry } from "./auth-logger";
import { setAuthLogSink } from "./auth-logger";

const conn =
  typeof process !== "undefined" &&
  (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING ||
    process.env.APPINSIGHTS_INSTRUMENTATIONKEY);

if (conn) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const appInsights = require("applicationinsights");
    appInsights.setup(conn).start();
    const client = appInsights.defaultClient;

    setAuthLogSink((entry: Omit<AuthLogEntry, "timestamp">) => {
      const properties: Record<string, string> = {
        level: entry.level,
        message: entry.message,
      };
      if (entry.email != null) properties.email = entry.email;
      if (entry.userId != null) properties.userId = entry.userId;
      if (entry.errorType != null) properties.errorType = entry.errorType;
      if (entry.metadata) {
        for (const [k, v] of Object.entries(entry.metadata)) {
          properties[k] = typeof v === "string" ? v : JSON.stringify(v);
        }
      }
      client.trackEvent({ name: entry.event, properties });
    });
  } catch {
    setAuthLogSink(null);
  }
}
