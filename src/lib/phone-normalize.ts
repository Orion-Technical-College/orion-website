import { parsePhoneNumber, AsYouType, getCountryCallingCode } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";

/**
 * Normalize phone number to E.164 format
 * @param phone - Raw phone number string
 * @param defaultRegion - Default country code (e.g., "US") for parsing
 * @returns Normalized E.164 phone number (includes +) or null if invalid
 */
export function normalizePhoneToE164(
  phone: string,
  defaultRegion: CountryCode = "US"
): string | null {
  if (!phone || typeof phone !== "string") {
    return null;
  }

  try {
    const phoneNumber = parsePhoneNumber(phone, defaultRegion);
    if (phoneNumber.isValid()) {
      return phoneNumber.format("E.164"); // Returns format like +15551234567
    }
    return null;
  } catch (error) {
    // Invalid phone number
    return null;
  }
}

/**
 * Validate phone number format
 * @param phone - Phone number string
 * @param defaultRegion - Default country code for parsing
 * @returns true if valid, false otherwise
 */
export function isValidPhoneNumber(
  phone: string,
  defaultRegion: CountryCode = "US"
): boolean {
  if (!phone || typeof phone !== "string") {
    return false;
  }

  try {
    const phoneNumber = parsePhoneNumber(phone, defaultRegion);
    return phoneNumber.isValid();
  } catch (error) {
    return false;
  }
}

/**
 * Format phone number for display
 * @param phone - E.164 phone number or raw phone
 * @param defaultRegion - Default country code
 * @returns Formatted phone number for display
 */
export function formatPhoneForDisplay(
  phone: string,
  defaultRegion: CountryCode = "US"
): string {
  if (!phone) return "";

  try {
    const phoneNumber = parsePhoneNumber(phone, defaultRegion);
    if (phoneNumber.isValid()) {
      return phoneNumber.formatNational(); // e.g., "(555) 123-4567"
    }
  } catch (error) {
    // Fall through to return original
  }

  return phone;
}

/**
 * Get country calling code for a region
 * @param countryCode - ISO country code (e.g., "US")
 * @returns Country calling code (e.g., "1")
 */
export function getCountryCode(countryCode: CountryCode): string {
  try {
    return getCountryCallingCode(countryCode);
  } catch (error) {
    return "1"; // Default to US
  }
}
