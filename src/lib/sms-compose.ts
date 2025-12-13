/**
 * SMS Compose Strategy for Android PWA
 * Opens native Messages app with pre-filled phone and message
 */

export type ComposeMethod = "SMS_URI" | "WEB_SHARE" | "COPY_ONLY" | "FAILED";

export interface ComposeResult {
  method: ComposeMethod;
  error?: string;
}

/**
 * Copy message to clipboard with fallback
 * @param message - Message text to copy
 * @returns true if successful, false otherwise
 */
async function copyToClipboard(message: string): Promise<boolean> {
  try {
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(message);
      return true;
    }

    // Fallback to execCommand for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = message;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  } catch (error) {
    console.error("[SMS_COMPOSE] Clipboard copy failed:", error);
    return false;
  }
}

/**
 * Open SMS compose using SMS URI scheme
 * @param phoneE164 - Phone number in E.164 format (includes +)
 * @param message - Message text
 * @returns ComposeResult
 */
export async function openComposeAndroid(
  phoneE164: string,
  message: string
): Promise<ComposeResult> {
  // Validate phoneE164 is not null/empty
  if (!phoneE164 || phoneE164.trim() === "") {
    return {
      method: "FAILED",
      error: "Phone number is required",
    };
  }

  // Always copy message to clipboard first (with fallback)
  const copied = await copyToClipboard(message);
  if (copied) {
    // Show toast notification (caller should handle this)
    // "Copied. Paste in Messages if not prefilled."
  } else {
    // Clipboard failed - show textarea with "Select all" instruction
    // This will be handled by the UI component
    console.warn("[SMS_COMPOSE] Clipboard copy failed, user will need to paste manually");
  }

  try {
    // Primary: SMS URI scheme
    // phoneE164 already includes + (from libphonenumber normalization)
    const smsUri = `sms:${phoneE164}?body=${encodeURIComponent(message)}`;

    // window.location.href doesn't throw, so we can't detect failure
    // Treat as success - user will see if it didn't work
    window.location.href = smsUri;

    return {
      method: "SMS_URI",
    };
  } catch (error) {
    console.error("[SMS_COMPOSE] SMS URI failed:", error);
    return {
      method: "FAILED",
      error: error instanceof Error ? error.message : "Failed to open SMS",
    };
  }
}

/**
 * Open SMS compose using Web Share API (manual fallback)
 * @param message - Message text
 * @returns ComposeResult
 */
export async function openComposeWebShare(message: string): Promise<ComposeResult> {
  if (!navigator.share) {
    return {
      method: "FAILED",
      error: "Web Share API not supported",
    };
  }

  try {
    await navigator.share({
      text: message,
    });
    return {
      method: "WEB_SHARE",
    };
  } catch (error: any) {
    // User cancelled or error occurred
    if (error.name === "AbortError") {
      return {
        method: "COPY_ONLY",
      };
    }
    return {
      method: "FAILED",
      error: error.message || "Web Share failed",
    };
  }
}
