/**
 * Edular Leads Import API Test Script
 * 
 * Purpose: Validate Edular API contract and capture response schemas
 * Reference: ADR-002 (PCAS-Gated Edular Handoff)
 * 
 * Usage:
 *   npx tsx scripts/test-edular-api.ts
 * 
 * Required environment variables:
 *   EDULAR_API_URL      - API endpoint (default: https://api.edular.com/v1/leads/create)
 *   EDULAR_CLIENT_UID   - Client identifier provided by Edular
 *   EDULAR_API_KEY      - API key (if required - TBD with vendor)
 */

import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  apiUrl: process.env.EDULAR_API_URL || 'https://api.edular.com/v1/leads/create',
  clientUid: process.env.EDULAR_CLIENT_UID || '',
  apiKey: process.env.EDULAR_API_KEY || '',

  // Test mode - set to true to use sandbox/test endpoint if available
  testMode: process.env.EDULAR_TEST_MODE === 'true',

  // Dry run - log request but don't send
  dryRun: process.env.DRY_RUN === 'true',
};

// ============================================================================
// Types (from ADR-002)
// ============================================================================

interface EdularLeadPayload {
  // Required by Edular
  clientUid: string;

  // Required by Orion business rules
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  program?: string;
  highSchoolType?: 'high-school' | 'high-school-international' | 'ged' | 'home-school' | 'other';

  // Optional - for correlation
  studentId?: string;

  // Optional - program/enrollment
  campus?: string;
  startDate?: string; // YYYY-MM-DD
  inquiryDate?: string; // YYYY-MM-DD
  inquiryMessage?: string;

  // Optional - lead source
  admissionsLeadSourceCode?: string;
  statusName?: string;
  howDidYouKnowAboutUs?: string;

  // Optional - demographics
  gender?: string;
  dateOfBirth?: string;

  // Optional - address
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;

  // Optional - contact preferences
  preferredTimeOfContact?: string[];
  preferredDaysOfContact?: number[];
  notificationPreferences?: {
    email?: boolean;
    sms?: boolean;
  };

  // Optional - marketing/attribution
  marketingFields?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    cglid?: string;
    gbraid?: string;
    wbraid?: string;
    [key: string]: string | undefined;
  };
}

interface TestResult {
  testName: string;
  success: boolean;
  statusCode?: number;
  headers?: Record<string, string>;
  body?: unknown;
  error?: string;
  duration?: number;
}

// ============================================================================
// Test Payloads
// ============================================================================

function generateTestEmail(): string {
  const timestamp = Date.now();
  return `test.lead.${timestamp}@example-test.com`;
}

function generateTestPhone(): string {
  // Generate a test phone number (use a known test range)
  return '+15005550001';
}

const TEST_PAYLOADS = {
  // Test 1: Minimal required fields (Edular minimum)
  minimal: (): EdularLeadPayload => ({
    clientUid: CONFIG.clientUid,
  }),

  // Test 2: Edular recommended fields
  recommended: (): EdularLeadPayload => ({
    clientUid: CONFIG.clientUid,
    firstName: 'Test',
    lastName: 'Lead',
    email: generateTestEmail(),
  }),

  // Test 3: All Orion required fields (business rules)
  orionRequired: (): EdularLeadPayload => ({
    clientUid: CONFIG.clientUid,
    firstName: 'Test',
    lastName: 'OrionLead',
    email: generateTestEmail(),
    phone: generateTestPhone(),
    program: 'TEST_PROGRAM',
    highSchoolType: 'high-school',
    studentId: `EMC-TEST-${Date.now()}`,
  }),

  // Test 4: Full payload with all mapped fields
  fullPayload: (): EdularLeadPayload => ({
    clientUid: CONFIG.clientUid,
    firstName: 'Test',
    lastName: 'FullPayload',
    email: generateTestEmail(),
    phone: generateTestPhone(),
    program: 'TEST_PROGRAM',
    campus: 'MAIN',
    highSchoolType: 'high-school',
    studentId: `EMC-TEST-${Date.now()}`,
    startDate: '2025-09-01',
    inquiryDate: new Date().toISOString().split('T')[0],
    notificationPreferences: {
      email: true,
      sms: true,
    },
    marketingFields: {
      utm_source: 'test',
      utm_medium: 'api_test',
      utm_campaign: 'adr002_validation',
    },
  }),

  // Test 5: International student
  international: (): EdularLeadPayload => ({
    clientUid: CONFIG.clientUid,
    firstName: 'Test',
    lastName: 'International',
    email: generateTestEmail(),
    phone: generateTestPhone(),
    program: 'TEST_PROGRAM',
    highSchoolType: 'high-school-international',
    studentId: `EMC-TEST-INTL-${Date.now()}`,
  }),

  // Test 6: Missing required field (validation error expected)
  missingClientUid: (): EdularLeadPayload => ({
    clientUid: '', // Empty - should fail
    firstName: 'Test',
    lastName: 'MissingClientUid',
    email: generateTestEmail(),
  }),

  // Test 7: Invalid enum value (validation error expected)
  invalidEnum: (): EdularLeadPayload => ({
    clientUid: CONFIG.clientUid,
    firstName: 'Test',
    lastName: 'InvalidEnum',
    email: generateTestEmail(),
    highSchoolType: 'invalid-value' as EdularLeadPayload['highSchoolType'],
  }),
};

// ============================================================================
// API Client
// ============================================================================

async function callEdularApi(payload: EdularLeadPayload): Promise<{
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  duration: number;
}> {
  const startTime = Date.now();

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'EMC-Workspace/1.0 (ADR-002-Test)',
  };

  // Add auth header if API key is provided
  if (CONFIG.apiKey) {
    // Try common auth header patterns - adjust based on vendor confirmation
    headers['X-API-Key'] = CONFIG.apiKey;
    // Alternative: headers['Authorization'] = `Bearer ${CONFIG.apiKey}`;
  }

  const requestBody = JSON.stringify(payload);

  console.log('\n--- Request ---');
  console.log(`POST ${CONFIG.apiUrl}`);
  console.log('Headers:', JSON.stringify(headers, null, 2));
  console.log('Body:', JSON.stringify(payload, null, 2));
  console.log('Body hash:', crypto.createHash('sha256').update(requestBody).digest('hex').substring(0, 16));

  if (CONFIG.dryRun) {
    console.log('\n[DRY RUN] Request not sent');
    return {
      statusCode: 0,
      headers: {},
      body: { dryRun: true },
      duration: 0,
    };
  }

  const response = await fetch(CONFIG.apiUrl, {
    method: 'POST',
    headers,
    body: requestBody,
  });

  const duration = Date.now() - startTime;

  // Capture response headers
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  // Parse response body
  let body: unknown;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  console.log('\n--- Response ---');
  console.log(`Status: ${response.status} ${response.statusText}`);
  console.log('Headers:', JSON.stringify(responseHeaders, null, 2));
  console.log('Body:', JSON.stringify(body, null, 2));
  console.log(`Duration: ${duration}ms`);

  return {
    statusCode: response.status,
    headers: responseHeaders,
    body,
    duration,
  };
}

// ============================================================================
// Test Runner
// ============================================================================

async function runTest(
  testName: string,
  payloadFn: () => EdularLeadPayload,
  expectedSuccess: boolean
): Promise<TestResult> {
  console.log('\n' + '='.repeat(60));
  console.log(`TEST: ${testName}`);
  console.log('='.repeat(60));

  try {
    const payload = payloadFn();
    const result = await callEdularApi(payload);

    const isSuccess = expectedSuccess
      ? result.statusCode >= 200 && result.statusCode < 300
      : result.statusCode >= 400;

    return {
      testName,
      success: isSuccess,
      statusCode: result.statusCode,
      headers: result.headers,
      body: result.body,
      duration: result.duration,
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      testName,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runAllTests(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║         EDULAR LEADS IMPORT API TEST SUITE               ║');
  console.log('║         Reference: ADR-002                               ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  console.log('\nConfiguration:');
  console.log(`  API URL: ${CONFIG.apiUrl}`);
  console.log(`  Client UID: ${CONFIG.clientUid ? '***' + CONFIG.clientUid.slice(-4) : '(not set)'}`);
  console.log(`  API Key: ${CONFIG.apiKey ? '(set)' : '(not set)'}`);
  console.log(`  Test Mode: ${CONFIG.testMode}`);
  console.log(`  Dry Run: ${CONFIG.dryRun}`);

  if (!CONFIG.clientUid) {
    console.error('\n❌ ERROR: EDULAR_CLIENT_UID environment variable is required');
    console.log('\nUsage:');
    console.log('  EDULAR_CLIENT_UID=your-client-uid npx tsx scripts/test-edular-api.ts');
    console.log('\nFor dry run (no actual API calls):');
    console.log('  EDULAR_CLIENT_UID=test DRY_RUN=true npx tsx scripts/test-edular-api.ts');
    process.exit(1);
  }

  const results: TestResult[] = [];

  // Run tests
  results.push(await runTest('1. Minimal (clientUid only)', TEST_PAYLOADS.minimal, true));
  results.push(await runTest('2. Recommended fields', TEST_PAYLOADS.recommended, true));
  results.push(await runTest('3. Orion required fields', TEST_PAYLOADS.orionRequired, true));
  results.push(await runTest('4. Full payload', TEST_PAYLOADS.fullPayload, true));
  results.push(await runTest('5. International student', TEST_PAYLOADS.international, true));
  results.push(await runTest('6. Missing clientUid (expect 400)', TEST_PAYLOADS.missingClientUid, false));
  results.push(await runTest('7. Invalid enum (expect 400)', TEST_PAYLOADS.invalidEnum, false));

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  for (const result of results) {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const statusCode = result.statusCode ? ` (${result.statusCode})` : '';
    const duration = result.duration ? ` [${result.duration}ms]` : '';
    console.log(`  ${status} ${result.testName}${statusCode}${duration}`);
  }

  console.log('\n' + '-'.repeat(60));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

  // Output response schema for documentation
  console.log('\n' + '='.repeat(60));
  console.log('RESPONSE SCHEMA CAPTURE (for ADR-002)');
  console.log('='.repeat(60));

  const successResult = results.find(r => r.statusCode && r.statusCode >= 200 && r.statusCode < 300);
  const errorResult = results.find(r => r.statusCode && r.statusCode >= 400);

  if (successResult) {
    console.log('\nSuccess Response Schema:');
    console.log(JSON.stringify({
      statusCode: successResult.statusCode,
      body: successResult.body,
    }, null, 2));
  }

  if (errorResult) {
    console.log('\nError Response Schema:');
    console.log(JSON.stringify({
      statusCode: errorResult.statusCode,
      body: errorResult.body,
    }, null, 2));
  }

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// ============================================================================
// Main
// ============================================================================

runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
