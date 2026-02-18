# Azure Communication Services Email Setup (CLI-First)

This guide configures invite and password email delivery for EMC Workspace using Azure Communication Services (ACS) and Azure CLI.

## Prerequisites

- Azure CLI installed and logged in (`az login`)
- Access to subscription containing `orion-website-rg`
- App Service: `emc-workspace`
- Optional staging slot: `staging`

## 1) Select subscription and verify resource group

```bash
az account show --output table
az account set --subscription "<YOUR_SUBSCRIPTION_NAME_OR_ID>"
az group show --name orion-website-rg --output table
```

## 2) Verify or create ACS Communication Services resource

If you already have a Communication Services resource, skip create and use show.

```bash
# List existing resources in the resource group
az communication list --resource-group orion-website-rg --output table

# Create (only if needed)
az communication create \
  --name emc-workspace-acs \
  --location eastus \
  --resource-group orion-website-rg

# Confirm
az communication show \
  --name emc-workspace-acs \
  --resource-group orion-website-rg \
  --output table
```

## 3) Get ACS connection string and sender address

```bash
# Get primary connection string
az communication list-key \
  --name emc-workspace-acs \
  --resource-group orion-website-rg \
  --query "primaryConnectionString" \
  --output tsv
```

You also need a verified sender address from your ACS Email domain (example: `no-reply@mg.emcsupport.com`).

If your tenant has the Email Communication Service CLI extension available, use:

```bash
# Optional: if extension is not installed
az extension add --name communication

# Discover linked email domains/resources where supported
az communication email domain list \
  --resource-group orion-website-rg \
  --output table
```

## 4) Configure App Service environment variables via CLI

Set production settings:

```bash
az webapp config appsettings set \
  --name emc-workspace \
  --resource-group orion-website-rg \
  --settings \
    EMAIL_PROVIDER="azure_communication_services" \
    EMAIL_INVITE_ENABLED="true" \
    ACS_EMAIL_CONNECTION_STRING="<ACS_PRIMARY_CONNECTION_STRING>" \
    ACS_EMAIL_SENDER_ADDRESS="no-reply@mg.emcsupport.com" \
    APP_BASE_URL="https://emc-workspace.azurewebsites.net"
```

Set staging settings:

```bash
az webapp config appsettings set \
  --name emc-workspace \
  --slot staging \
  --resource-group orion-website-rg \
  --settings \
    EMAIL_PROVIDER="azure_communication_services" \
    EMAIL_INVITE_ENABLED="true" \
    ACS_EMAIL_CONNECTION_STRING="<ACS_PRIMARY_CONNECTION_STRING>" \
    ACS_EMAIL_SENDER_ADDRESS="no-reply@mg.emcsupport.com" \
    APP_BASE_URL="https://emc-workspace-staging.azurewebsites.net"
```

## 5) Restart and verify settings

```bash
az webapp restart --name emc-workspace --resource-group orion-website-rg
az webapp restart --name emc-workspace --slot staging --resource-group orion-website-rg

az webapp config appsettings list \
  --name emc-workspace \
  --resource-group orion-website-rg \
  --query "[?name=='EMAIL_PROVIDER' || name=='EMAIL_INVITE_ENABLED' || name=='ACS_EMAIL_SENDER_ADDRESS' || name=='APP_BASE_URL']" \
  --output table
```

## 6) Runtime verification

```bash
# Stream logs while testing user invite/reset flows
az webapp log tail --name emc-workspace --resource-group orion-website-rg
```

In app admin UI:

- Create user with "Send invite email with temporary password" enabled
- Use "Resend invite" action for existing credentials users
- Use "Set password" and confirm email notification behavior

## Rollback / Safe Disable

Disable outbound invite/reset emails without code rollback:

```bash
az webapp config appsettings set \
  --name emc-workspace \
  --resource-group orion-website-rg \
  --settings EMAIL_INVITE_ENABLED="false"
```

## Notes

- `EMAIL_PROVIDER` currently supports `azure_communication_services`.
- Email errors are returned to admin APIs as status metadata so user creation/reset still returns explicit delivery status.
- Keep connection strings in App Service settings only. Do not commit secrets.
