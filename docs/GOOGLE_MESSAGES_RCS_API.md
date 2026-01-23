# Google Messages RCS Business Messaging API - Integration Guide

## Overview

This document outlines the requirements and setup process for integrating Google Messages RCS (Rich Communication Services) Business Messaging API to enable automated SMS sending via desktop.

## Account Type Requirements

### ❌ Personal Account: NOT SUFFICIENT

**A standard personal Google Account cannot be used** to access the RCS Business Messaging API. The API is exclusively designed for business-to-customer (B2C) messaging and requires a partner account.

### ✅ Required: RCS for Business Partner Account

To use the RCS Business Messaging API, you must:

1. **Register as an RCS for Business Partner** - This is a business account, not a personal account
2. **Use a corporate email address** - Personal email addresses are not accepted during registration
3. **Complete the Partner Registration Interest Form** - Google reviews and approves partner applications

## Registration Process

### Step 1: Submit Partner Registration Interest Form

1. Visit the [RCS for Business Partner Registration](https://developers.google.com/business-communications/rcs-business-messaging/guides/get-started/register-partner) page
2. Complete the form with:
   - First and last name
   - Job title
   - **Corporate email address** (required - personal emails are not accepted)
   - Google Account email for the partner account owner
3. Submit and wait for Google's approval

### Step 2: Access Business Communications Developer Console

After approval, you gain access to:
- RBM API (RCS Business Messaging API)
- Management API
- Business Communications Developer Console (https://business-communications.cloud.google.com)

### Step 3: Set Up Partner Account

In the Business Communications Developer Console:

1. **Update Partner Account Information:**
   - Partner name and display name
   - Technical point of contact
   - Webhook URL (for receiving messages and events)

2. **Manage Brands:**
   - Add, edit, and remove linked brands
   - Each brand can have multiple agents

3. **Create Service Account:**
   - Generate API authentication keys
   - Configure service account credentials for API calls

4. **Manage Account Users:**
   - Add team members with roles: Owner, Manager, or Reader

## Authentication & API Access

### OAuth Scope Required

```
https://www.googleapis.com/auth/rcsbusinessmessaging
```

### API Endpoint

```
https://rcsbusinessmessaging.googleapis.com
```

### Service Account Setup

1. Navigate to Partner Account settings in Business Communications Developer Console
2. Create a service account
3. Generate API key/credentials
4. Download credentials JSON file
5. Configure in your backend application

## Billing & Pricing

RCS for Business uses two billing models based on agent type:

### Non-Conversational Agents
- **Billing:** Per message
- **Use Case:** One-way communication
- **Examples:** OTPs, alerts, promotional offers

### Conversational Agents
- **Billing:** Per conversation (24-hour window)
- **Use Case:** Two-way messaging
- **Details:** Flat rate for all messages exchanged within 24 hours
- **Fallback:** If user doesn't reply within 24 hours, billed per individual message

### Cost Information
- Specific pricing details are not publicly disclosed
- Contact Google Business Communications team for pricing information
- Pricing may vary by region and message volume

## Rate Limits

- Rate limit specifics are not publicly documented
- Contact Google support or your account representative for rate limit information
- Rate limits may vary based on:
  - Partner account tier
  - Agent type (conversational vs non-conversational)
  - Message volume and region

## Regional Availability

- RCS Business Messaging availability varies by region and carrier
- Not all carriers support RCS Business Messaging
- Check with Google for availability in your target regions
- Some carriers may require additional network review access

## API Capabilities

The RCS Business Messaging API provides:

1. **Message Sending:**
   - Send text messages
   - Send rich media (images, videos, cards)
   - Send suggested replies and actions

2. **Agent Management:**
   - Create and manage agents
   - Configure agent capabilities
   - Set up webhooks for events

3. **Message Receiving:**
   - Receive user replies via webhooks
   - Handle delivery status updates
   - Process user interactions

## Integration Roadmap for Katie

### Current Status: ❌ Cannot Use Personal Account

**Answer:** No, a personal Google Account cannot be used. You need a business partner account.

### Steps to Enable Desktop SMS Automation:

1. **Register as Partner** (Requires Business Email)
   - Complete the [RCS for Business Partner Registration Interest Form](https://developers.google.com/business-communications/rcs-business-messaging/guides/get-started/register-partner)
   - Use a corporate/business email address
   - Wait for Google approval (timeline varies)

2. **Set Up Partner Account**
   - Access Business Communications Developer Console
   - Create service account and generate API keys
   - Configure webhook endpoints

3. **Create Agent**
   - Create an agent representing your brand
   - Specify hosting region, billing category, and use case
   - Complete agent verification process

4. **Backend Integration**
   - Implement OAuth authentication with required scope
   - Integrate RCS Business Messaging API endpoints
   - Set up webhook handlers for incoming messages
   - Implement message sending logic

5. **Testing & Launch**
   - Test in development environment
   - Complete agent verification
   - Launch agent for production use

## Limitations & Considerations

1. **Account Type:** Must be a business partner account, not personal
2. **Email Requirement:** Corporate email required for registration
3. **Approval Process:** Google reviews and approves partner applications
4. **Regional Restrictions:** Availability depends on carrier support
5. **Billing:** Pay-per-message or per-conversation model
6. **Rate Limits:** Not publicly documented, contact Google for details

## Resources

- [RCS for Business Documentation](https://developers.google.com/business-communications/rcs-business-messaging)
- [Partner Registration Guide](https://developers.google.com/business-communications/rcs-business-messaging/guides/get-started/register-partner)
- [API Reference](https://developers.google.com/business-communications/rcs-business-messaging/reference/rest)
- [Business Communications Developer Console](https://business-communications.cloud.google.com)
- [Billing FAQ](https://developers.google.com/business-communications/rcs-business-messaging/guides/learn/rbm-billing-faq)

## Next Steps

1. **For Katie:** Determine if you have access to a corporate/business email address to register as a partner
2. **If Yes:** Submit the Partner Registration Interest Form
3. **If No:** Consider:
   - Using a business email from your organization
   - Setting up a business Google Workspace account
   - Exploring alternative SMS API providers (Twilio, MessageBird, etc.)

## Alternative Solutions

If RCS Business Messaging is not feasible, consider:

- **Twilio SMS API** - Works with personal/business accounts, pay-per-message
- **MessageBird** - Business SMS API with global coverage
- **Vonage (formerly Nexmo)** - SMS API with competitive pricing
- **AWS SNS** - SMS service via AWS account

These alternatives may be easier to set up and don't require partner account approval.
