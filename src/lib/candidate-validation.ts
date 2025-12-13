import { normalizePhoneToE164, isValidPhoneNumber } from "./phone-normalize";

export type SmsConsentStatus = "UNKNOWN" | "OPTED_IN" | "OPTED_OUT";

export interface CanSendSmsResult {
  allowed: boolean;
  reason?: string;
  status: "ALLOWED" | "BLOCKED" | "INVALID_PHONE";
}

/**
 * Candidate type for SMS validation (minimal fields needed)
 */
interface CandidateForValidation {
  phone: string;
  smsConsentStatus?: string | null;
  smsOptOutAt?: Date | null;
}

/**
 * Check if SMS can be sent to a candidate
 * @param candidate - Candidate object (from Prisma or types)
 * @param defaultRegion - Default country code for phone validation (default: "US")
 * @returns Result with allowed status and reason
 */
export function canSendSms(
  candidate: CandidateForValidation,
  defaultRegion: string = "US"
): CanSendSmsResult {
  // Check consent status - UNKNOWN is treated as blocked per policy
  if (candidate.smsConsentStatus !== "OPTED_IN") {
    return {
      allowed: false,
      reason: candidate.smsConsentStatus === "OPTED_OUT"
        ? "Candidate has opted out of SMS"
        : "SMS consent status is unknown - explicit consent required",
      status: "BLOCKED",
    };
  }

  // Check if opted out
  if (candidate.smsOptOutAt) {
    return {
      allowed: false,
      reason: `Candidate opted out on ${candidate.smsOptOutAt.toISOString()}`,
      status: "BLOCKED",
    };
  }

  // Validate phone number
  if (!candidate.phone) {
    return {
      allowed: false,
      reason: "No phone number provided",
      status: "INVALID_PHONE",
    };
  }

  const isValid = isValidPhoneNumber(candidate.phone, defaultRegion as any);
  if (!isValid) {
    return {
      allowed: false,
      reason: "Phone number format is invalid",
      status: "INVALID_PHONE",
    };
  }

  return {
    allowed: true,
    status: "ALLOWED",
  };
}

/**
 * Determine blocked reason for a candidate
 * @param candidate - Candidate object (from Prisma or types)
 * @param phoneE164 - Normalized phone number (null if invalid)
 * @returns Blocked reason enum value or null if not blocked
 */
export function getBlockedReason(
  candidate: CandidateForValidation,
  phoneE164: string | null
): "OPTED_OUT" | "CONSENT_UNKNOWN" | "INVALID_PHONE" | null {
  if (candidate.smsConsentStatus === "OPTED_OUT" || candidate.smsOptOutAt) {
    return "OPTED_OUT";
  }

  if (candidate.smsConsentStatus !== "OPTED_IN") {
    return "CONSENT_UNKNOWN";
  }

  if (!phoneE164) {
    return "INVALID_PHONE";
  }

  return null;
}
