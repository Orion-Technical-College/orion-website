import { setupWorker } from "msw/browser";
import { handlers } from "./msw-handlers";

/**
 * MSW setupWorker for browser-like environment (component tests)
 */
export const worker = setupWorker(...handlers);

