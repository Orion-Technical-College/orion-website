# Azure Infrastructure Setup Guide

This guide covers the complete setup for deploying EMC Workspace to Azure, repurposing the existing Orion infrastructure.

## Prerequisites

1. **Azure CLI** installed and logged in
2. **GitHub repository** access with admin permissions
3. **Azure subscription** with existing Orion resources

## Quick Start

```bash
# 1. Install Azure CLI (macOS)
brew install azure-cli

# 2. Login to Azure
az login

# 3. Set your subscription (if you have multiple)
az account list --output table
az account set --subscription "Your Subscription Name"

# 4. Run the setup script
chmod +x scripts/azure-setup.sh
./scripts/azure-setup.sh
```

---

## Infrastructure Overview

| Component | Old (Orion) | New (EMC Workspace) |
|-----------|-------------|---------------------|
| Resource Group | orion-website-rg | orion-website-rg (reused) |
| App Service | orion-website (Windows) | emc-workspace (Linux) |
| App Service Plan | (varies) | emc-workspace-plan |
| SQL Server | orionweb-sqlserver | orionweb-sqlserver (reused) |
| Database | OrionWebDB | EMCWorkspaceDB |
| Runtime | .NET Framework | Node.js 20 |

---

## GitHub Secrets Configuration

Navigate to: **GitHub Repo → Settings → Secrets and variables → Actions**

### Required Secrets

#### 1. `DATABASE_URL`

Prisma connection string for Azure SQL:

```
sqlserver://orionweb-sqlserver.database.windows.net:1433;database=EMCWorkspaceDB;user=YOUR_USERNAME;password=YOUR_PASSWORD;encrypt=true
```

**To get credentials:**
```bash
# If you don't know the SQL admin credentials, reset them:
az sql server update \
  --name orionweb-sqlserver \
  --resource-group orion-website-rg \
  --admin-password "NewSecurePassword123!"
```

#### 2. `AZURE_WEBAPP_PUBLISH_PROFILE_STAGING`

Download from Azure Portal:
1. Go to **Azure Portal** → **App Services** → **emc-workspace**
2. Click **Deployment slots** → **staging**
3. Click **Get publish profile** (downloads XML file)
4. Copy entire contents of the XML file
5. Paste as the secret value

Or via CLI:
```bash
az webapp deployment list-publishing-profiles \
  --name emc-workspace \
  --slot staging \
  --resource-group orion-website-rg \
  --xml
```

#### 3. `AZURE_CREDENTIALS`

Service principal JSON for slot swapping (production deployment):

```bash
# Create a service principal with Contributor access
az ad sp create-for-rbac \
  --name "emc-workspace-github" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/orion-website-rg \
  --sdk-auth
```

This outputs JSON like:
```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```

Copy the entire JSON output as the secret value.

---

## App Service Configuration

### Environment Variables

Set these in the App Service (both production and staging):

```bash
# Production
az webapp config appsettings set \
  --name emc-workspace \
  --resource-group orion-website-rg \
  --settings \
    DATABASE_URL="sqlserver://orionweb-sqlserver.database.windows.net:1433;database=EMCWorkspaceDB;user=YOUR_USERNAME;password=YOUR_PASSWORD;encrypt=true" \
    NEXTAUTH_URL="https://emc-workspace.azurewebsites.net" \
    NEXTAUTH_SECRET="$(openssl rand -base64 32)" \
    AZURE_OPENAI_API_KEY="your-azure-openai-api-key" \
    AZURE_OPENAI_ENDPOINT="https://ai-canvas-openai.openai.azure.com" \
    AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4o" \
    FEATURE_AI_ASSISTANT="true" \
    NODE_ENV="production"

# Staging
az webapp config appsettings set \
  --name emc-workspace \
  --slot staging \
  --resource-group orion-website-rg \
  --settings \
    DATABASE_URL="sqlserver://orionweb-sqlserver.database.windows.net:1433;database=EMCWorkspaceDB;user=YOUR_USERNAME;password=YOUR_PASSWORD;encrypt=true" \
    NEXTAUTH_URL="https://emc-workspace-staging.azurewebsites.net" \
    NEXTAUTH_SECRET="$(openssl rand -base64 32)" \
    AZURE_OPENAI_API_KEY="your-azure-openai-api-key" \
    AZURE_OPENAI_ENDPOINT="https://ai-canvas-openai.openai.azure.com" \
    AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4o" \
    FEATURE_AI_ASSISTANT="true" \
    NODE_ENV="production"
```

#### Azure OpenAI Configuration

To get your Azure OpenAI API key and endpoint:

1. **Navigate to Azure Portal** → **Azure OpenAI** → `ai-canvas-openai` (or your resource name)
2. **Get API Key**:
   - Go to **Keys and Endpoint** in the left sidebar
   - Copy **KEY 1** or **KEY 2**
3. **Get Endpoint**:
   - The endpoint is shown in the **Keys and Endpoint** page
   - Format: `https://ai-canvas-openai.openai.azure.com`
4. **Deployment Name**:
   - Go to **Deployments** in the left sidebar
   - Note the deployment name (default: `gpt-4o`)

**Note**: The AI Assistant feature can be disabled by setting `FEATURE_AI_ASSISTANT="false"` for gradual rollout or troubleshooting.

### Startup Command

Already configured by the setup script, but can be set manually:

```bash
az webapp config set \
  --name emc-workspace \
  --resource-group orion-website-rg \
  --startup-file "node_modules/.bin/next start"
```

---

## Database Migration

After setting up the infrastructure and GitHub secrets:

```bash
# Set the DATABASE_URL locally
export DATABASE_URL="sqlserver://orionweb-sqlserver.database.windows.net:1433;database=EMCWorkspaceDB;user=YOUR_USERNAME;password=YOUR_PASSWORD;encrypt=true"

# Push the Prisma schema to create tables
npx prisma db push

# Or if you have migrations:
npx prisma migrate deploy
```

---

## SQL Server Firewall

Ensure GitHub Actions can connect to the database:

```bash
# Allow Azure services
az sql server firewall-rule create \
  --name AllowAzureServices \
  --server orionweb-sqlserver \
  --resource-group orion-website-rg \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# For local development, add your IP
MY_IP=$(curl -s ifconfig.me)
az sql server firewall-rule create \
  --name MyLocalIP \
  --server orionweb-sqlserver \
  --resource-group orion-website-rg \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP
```

---

## Verification

After deployment, verify everything is working:

```bash
# Check App Service status
az webapp show --name emc-workspace --resource-group orion-website-rg --query state

# Check staging slot
az webapp show --name emc-workspace --slot staging --resource-group orion-website-rg --query state

# Test the endpoints
curl -I https://emc-workspace.azurewebsites.net
curl -I https://emc-workspace-staging.azurewebsites.net
```

---

## Troubleshooting

### "Resource not found" errors
- Ensure you're using the correct subscription: `az account show`
- Check resource group exists: `az group show --name orion-website-rg`

### Database connection failures
- Check firewall rules allow Azure services
- Verify the connection string format for Prisma
- Test with a simple query: `az sql db query --name EMCWorkspaceDB --server orionweb-sqlserver --resource-group orion-website-rg`

### Deployment failures
- Check GitHub Actions logs
- Verify publish profile is correctly copied (no truncation)
- Ensure Node.js version matches (20.x)

### Logs
```bash
# Stream live logs
az webapp log tail --name emc-workspace --resource-group orion-website-rg

# Download logs
az webapp log download --name emc-workspace --resource-group orion-website-rg
```

---

## Custom Domain (Future)

When ready to use a custom domain:

```bash
# Add custom domain
az webapp config hostname add \
  --hostname app.emcsupport.com \
  --webapp-name emc-workspace \
  --resource-group orion-website-rg

# Enable managed SSL certificate
az webapp config ssl create \
  --name emc-workspace \
  --resource-group orion-website-rg \
  --hostname app.emcsupport.com
```

Then update DNS at your registrar:
- CNAME: `app` → `emc-workspace.azurewebsites.net`

---

## Summary Checklist

- [ ] Azure CLI installed and logged in
- [ ] Ran `scripts/azure-setup.sh` successfully
- [ ] Added `DATABASE_URL` secret to GitHub
- [ ] Added `AZURE_WEBAPP_PUBLISH_PROFILE_STAGING` secret to GitHub  
- [ ] Added `AZURE_CREDENTIALS` secret to GitHub
- [ ] Configured App Service environment variables
- [ ] Ran Prisma database migration
- [ ] Tested production URL: https://emc-workspace.azurewebsites.net
- [ ] Tested staging URL: https://emc-workspace-staging.azurewebsites.net

