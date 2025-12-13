/**
 * IndexedDB wrapper for Guided Send Session UI context
 * Server is source of truth - this only stores UI state (scroll position, etc.)
 */

interface GuidedSendUIState {
  sessionId: string;
  scrollPosition?: number;
  lastViewedRecipientId?: string;
  // Add other UI-specific state as needed
}

const DB_NAME = "emc-workspace";
const DB_VERSION = 1;
const STORE_NAME = "guided-send-sessions";

let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
async function initDB(): Promise<IDBDatabase> {
  if (db) {
    return db;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, {
          keyPath: "sessionId",
        });
        objectStore.createIndex("sessionId", "sessionId", { unique: true });
      }
    };
  });
}

/**
 * Save UI context for a session
 * @param sessionId - Session ID
 * @param uiState - UI state to persist
 */
export async function saveSession(
  sessionId: string,
  uiState: Partial<GuidedSendUIState>
): Promise<void> {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const state: GuidedSendUIState = {
      sessionId,
      ...uiState,
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(state);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to save session"));
    });
  } catch (error) {
    console.error("[SESSION_STORAGE] Failed to save session:", error);
    // Fail silently - UI state is not critical
  }
}

/**
 * Load UI context for a session
 * @param sessionId - Session ID
 * @returns UI state or null if not found
 */
export async function loadSession(
  sessionId: string
): Promise<GuidedSendUIState | null> {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise<GuidedSendUIState | null>((resolve, reject) => {
      const request = store.get(sessionId);
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        reject(new Error("Failed to load session"));
      };
    });
  } catch (error) {
    console.error("[SESSION_STORAGE] Failed to load session:", error);
    return null;
  }
}

/**
 * Clear UI context for a session
 * @param sessionId - Session ID
 */
export async function clearSession(sessionId: string): Promise<void> {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(sessionId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to clear session"));
    });
  } catch (error) {
    console.error("[SESSION_STORAGE] Failed to clear session:", error);
    // Fail silently
  }
}
