import { setupServer } from "msw/node";
import { handlers } from "./msw-handlers";

/**
 * MSW setupServer for Node environment (integration tests)
 */
export const server = setupServer(...handlers);

