# Split Message Mode and iOS CSV Upload Tests

This document describes the test suite for the multi-part message sequencing feature and iOS CSV upload fixes.

## Test Files Created

### 1. Integration Tests

#### `integration/split-message-mode.test.ts`
Tests the database schema and data persistence for split message mode:
- Campaign split message mode creation and configuration
- CampaignRecipient currentMessagePart tracking
- GuidedSendRecipient currentMessagePart tracking
- Status logic for split messages (PENDING until all parts sent)
- Handling of campaigns with only 2 messages (no Message 3)

**Key Test Cases:**
- ✅ Campaign with split mode enabled stores all three message templates
- ✅ CampaignRecipient tracks currentMessagePart through sequence (1 → 2 → 3)
- ✅ GuidedSendRecipient tracks currentMessagePart through sequence
- ✅ Status remains PENDING until final message part is sent
- ✅ Status becomes SENT after Message 2 when Message 3 is empty

#### `integration/api-split-message.test.ts`
Tests the API endpoint logic for split message mode:
- CampaignRecipient PATCH endpoint logic
- GuidedSendRecipient PATCH endpoint logic
- Session creation with split message configuration
- Status transitions based on currentMessagePart

**Key Test Cases:**
- ✅ CampaignRecipient updates currentMessagePart from null → 1 → 2 → 3
- ✅ CampaignRecipient marks as SENT when currentMessagePart is 3
- ✅ CampaignRecipient marks as SENT when currentMessagePart is 2 and Message 3 is empty
- ✅ GuidedSendRecipient updates currentMessagePart through sequence
- ✅ Session stores split message config in variablesSnapshot

#### `integration/csv-import-ios.test.ts`
Tests iOS-specific CSV upload fixes:
- MIME type validation with iOS fallbacks
- File input clearing on click (iOS fix)
- File extension validation
- Empty file validation

**Key Test Cases:**
- ✅ Accepts CSV with `text/csv` MIME type
- ✅ Accepts CSV with `text/plain` MIME type (iOS fallback)
- ✅ Accepts CSV with empty MIME type but valid `.csv` extension (iOS fallback)
- ✅ Clears file input value on click to allow re-selection
- ✅ Rejects invalid file types
- ✅ Rejects empty files

### 2. Unit Tests

#### `unit/split-message-utils.test.ts`
Tests template interpolation utilities for split messages:
- Message 1 template interpolation (text only, no links)
- Message 2 template interpolation (link only)
- Message 3 template interpolation (fallback text)
- SMS segment calculation for each message part
- Complete split message sequence

**Key Test Cases:**
- ✅ Message 1 interpolates without links
- ✅ Message 2 interpolates with Calendly/Zoom links
- ✅ Message 3 interpolates fallback text
- ✅ SMS segment calculation for each part
- ✅ Handles missing Message 3 gracefully

## Test Coverage

### Split Message Mode Feature
- ✅ Database schema (Campaign, CampaignRecipient, GuidedSendRecipient)
- ✅ State persistence (currentMessagePart tracking)
- ✅ Status logic (PENDING → SENT transitions)
- ✅ Template interpolation for all three message parts
- ✅ Handling of optional Message 3
- ✅ SMS segment calculation and validation

### iOS CSV Upload Fix
- ✅ MIME type validation with iOS-specific fallbacks
- ✅ File input clearing on click
- ✅ File extension validation
- ✅ Empty file detection

## Running Tests

```bash
# Run all tests
npm test

# Run only integration tests
npm run test:integration

# Run only unit tests
npm run test:unit

# Run specific test file
npm test -- split-message-mode
npm test -- csv-import-ios
npm test -- split-message-utils

# Run with coverage
npm run test:coverage
```

## Test Environment Requirements

Integration tests require:
- `DATABASE_URL` environment variable set to a test database (must contain "_test")
- `NODE_ENV=test`
- Test database must be accessible and migrations must be run

Unit tests run in isolation and don't require a database connection.

## Notes

- Integration tests are automatically skipped if DATABASE_URL is not configured or doesn't contain "_test"
- Tests follow the existing patterns in the codebase (using `testPrisma` for database operations)
- All tests use Jest with the appropriate test environment (`node` or `jsdom`)

