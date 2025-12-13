# Campaign Workflow Testing Guide

This document describes how to test the SMS campaign workflow where users select candidates and send personalized SMS messages.

## Overview

The campaign workflow allows recruiters to:
1. Select candidates from the data table
2. Create a message template with merge tags
3. Preview personalized messages for each candidate
4. Send SMS messages via the native Messages app (using `sms:` URI)

## Testing Steps

### Prerequisites

1. **Login**: Ensure you're logged in as a recruiter
2. **Candidates**: Have at least 3-5 candidates in the database
3. **Phone Numbers**: Candidates should have valid phone numbers

### Step 1: Select Candidates

1. Navigate to the **Workspace** tab
2. In the **Data Table** tab, select candidates by:
   - Clicking checkboxes next to candidate rows
   - Or using "Select All" button
3. Verify selected candidates are highlighted
4. Note the count of selected candidates

### Step 2: Navigate to Campaign Builder

**Desktop:**
- Click the **"Send SMS"** tab in the workspace

**Mobile/Alternative:**
- Click the **"Campaigns"** tab in the main navigation

### Step 3: Configure Campaign

1. **Campaign Name** (optional):
   - Enter a descriptive name (e.g., "Q1 2024 Outreach")

2. **Calendly URL**:
   - Enter your Calendly link (e.g., `https://calendly.com/your-link`)
   - This will be used in `{{calendly_link}}` merge tag

3. **Zoom URL** (optional):
   - Enter Zoom meeting link if needed
   - Used in `{{zoom_link}}` merge tag

4. **Message Template**:
   - Default template: `"Hi {{name}}, thanks for your interest in the {{role}} position. Book a call: {{calendly_link}}"`
   - You can edit this template
   - Use merge tag buttons to insert: `{{name}}`, `{{city}}`, `{{role}}`, `{{calendly_link}}`, `{{zoom_link}}`

5. **Character Count**:
   - Verify character count is displayed
   - SMS messages are typically 160 characters per segment
   - Verify SMS segment count is calculated correctly

### Step 4: Verify Candidate Selection

1. In the right panel, verify:
   - **Selected count** matches your selections
   - Selected candidates are listed
   - Each selected candidate shows:
     - Name
     - Phone number
     - Job title
     - **Preview** of personalized message (when selected)

2. **Preview Verification**:
   - Select a candidate checkbox
   - Verify the preview message appears below their info
   - Check that merge tags are replaced:
     - `{{name}}` → First name
     - `{{city}}` → City from location
     - `{{role}}` → Job title
     - `{{calendly_link}}` → Calendly URL
     - `{{zoom_link}}` → Zoom URL or "N/A"

### Step 5: Test Individual Send

1. For a selected candidate, click the **"Send"** button
2. **Expected Behavior**:
   - Native Messages app should open (on mobile)
   - Or SMS client opens (on desktop)
   - Phone number is pre-filled
   - Message is pre-filled with personalized content
   - **IMPORTANT**: The message is NOT automatically sent
   - User must manually tap "Send" in the Messages app
3. **Note**: In browser, this may open a new tab with `sms:` URI
4. **User Action Required**: After Messages app opens, user must:
   - Review the pre-filled message
   - Tap "Send" button in the Messages app
   - Message is sent from user's personal phone number
5. Verify the candidate's status changes to "sent" (checkmark icon) after you send

### Step 6: Test Batch Send

1. Select multiple candidates (3-5)
2. Click the **"Send to X candidates"** button at the bottom
3. **Expected Behavior**:
   - Messages app opens sequentially for each candidate
   - Each message is personalized and pre-filled
   - Small delay (500ms) between each open to prevent browser blocking
   - **IMPORTANT**: Messages are NOT automatically sent
4. **User Action Required**: For each candidate:
   - Messages app opens with pre-filled data
   - User reviews the message
   - User taps "Send" in Messages app
   - Returns to EMC Workspace (or next candidate opens)
5. **Note**: On desktop, multiple tabs may open; on mobile, Messages app opens for each
6. **Workflow**: This creates a rapid workflow where user can quickly send multiple messages by just tapping "Send" in each Messages app window

### Step 7: Verify Status Tracking

1. After sending, verify:
   - Sent candidates show a green checkmark (✓)
   - Sent candidates are grayed out (opacity-60)
   - "Send" button is hidden for sent candidates
2. Verify the sent count updates

## Expected Behavior

### Merge Tag Interpolation

| Merge Tag | Replaced With |
|-----------|---------------|
| `{{name}}` | First name of candidate |
| `{{city}}` | City from location field |
| `{{role}}` | Job title |
| `{{calendly_link}}` | Calendly URL from input |
| `{{zoom_link}}` | Zoom URL from input or "N/A" |

### SMS URI Format

The generated SMS URI should follow this format:
```
sms:1234567890?body=Hi%20John%2C%20thanks%20for%20your%20interest...
```

- Phone number is cleaned (digits only)
- Message is URL-encoded
- Opens native Messages app on mobile devices

### Character Count

- Character count updates in real-time as you type
- SMS segments calculated: `Math.ceil(characterCount / 160)`
- Example: 320 characters = 2 SMS messages

## Common Issues & Troubleshooting

### Issue: Merge tags not replaced in preview

**Solution**: 
- Verify merge tag syntax: `{{tag_name}}` (with double curly braces)
- Check that candidate data exists (name, location, jobTitle)
- Ensure template uses correct tag names

### Issue: SMS URI doesn't open Messages app

**Possible Causes**:
- Browser blocking popups (allow popups for the site)
- No default SMS client configured
- Testing on desktop (use mobile device or emulator)

**Solution**:
- Allow popups in browser settings
- Test on actual mobile device
- Check browser console for errors

### Issue: Phone number format incorrect

**Solution**:
- Phone numbers are automatically cleaned (non-digits removed)
- Verify candidate phone numbers in database
- Check `generateSmsUri` function in `src/lib/utils.ts`

### Issue: Preview not showing for selected candidates

**Solution**:
- Ensure candidate checkbox is checked
- Verify candidate has required fields (name, location, jobTitle)
- Check browser console for errors

## Testing Checklist

- [ ] Can select candidates from data table
- [ ] Selected candidates appear in campaign builder
- [ ] Campaign name can be set
- [ ] Calendly URL can be entered
- [ ] Message template can be edited
- [ ] Merge tag buttons insert tags correctly
- [ ] Character count updates in real-time
- [ ] SMS segment count is calculated correctly
- [ ] Preview shows personalized message for selected candidates
- [ ] Merge tags are replaced in preview:
  - [ ] `{{name}}` → First name
  - [ ] `{{city}}` → City
  - [ ] `{{role}}` → Job title
  - [ ] `{{calendly_link}}` → Calendly URL
  - [ ] `{{zoom_link}}` → Zoom URL
- [ ] Individual "Send" button opens SMS URI
- [ ] Batch "Send to X candidates" button works
- [ ] Sent status is tracked (checkmark appears)
- [ ] Sent candidates are grayed out
- [ ] "Send" button hidden for sent candidates

## Automated Testing

Run the Playwright E2E test:

```bash
npm run test:e2e -- tests/e2e/campaign-workflow.spec.ts
```

Or run all E2E tests:

```bash
npm run test:e2e
```

## Notes

- **Google Messages API**: The current implementation uses `sms:` URI scheme to open the native Messages app. The Google Messages API key stored in settings is not currently used for sending. This is by design - messages are sent from the recruiter's personal phone number.

- **Manual Send Required**: The app does NOT automatically send messages. It opens the Messages app with pre-filled phone number and message, but the user must manually tap "Send" in the Messages app. This is a security feature and gives users control to review/edit messages before sending.

- **Workflow**: The intended workflow is:
  1. Click "Send" in campaign builder → Messages app opens
  2. User reviews pre-filled message
  3. User taps "Send" in Messages app
  4. Message is sent from user's personal phone number
  5. User returns to EMC Workspace for next candidate

- **Mobile Testing**: For best results, test on an actual mobile device where the `sms:` URI will open the native Messages app.

- **Browser Popup Blockers**: Ensure popup blockers are disabled for the application URL when testing SMS URI functionality.
