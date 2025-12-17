#!/bin/bash

# Script to get the current DATABASE_URL from Azure App Service
# Use this to copy the connection string to GitHub Secrets

set -e

echo "=========================================="
echo "Get DATABASE_URL from Azure App Service"
echo "=========================================="
echo ""

# Configuration
RESOURCE_GROUP="orion-website-rg"
APP_SERVICE_NAME="emc-workspace"

echo "Fetching DATABASE_URL from App Service..."
echo ""

# Get the DATABASE_URL from App Service
DATABASE_URL=$(az webapp config appsettings list \
  --name "$APP_SERVICE_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "[?name=='DATABASE_URL'].value" \
  --output tsv)

if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not found in App Service settings"
  echo ""
  echo "You may need to set it first using scripts/update-database-url.sh"
  exit 1
fi

echo "✅ Found DATABASE_URL in App Service"
echo ""
echo "=========================================="
echo "📋 Connection String:"
echo "=========================================="
echo ""
echo "$DATABASE_URL"
echo ""
echo "=========================================="
echo "🔐 Next Steps:"
echo "=========================================="
echo ""
echo "1. Copy the connection string above"
echo ""
echo "2. Update GitHub Secret:"
echo "   - Go to: https://github.com/Orion-Technical-College/orion-website"
echo "   - Navigate to: Settings → Secrets and variables → Actions"
echo "   - Find or create: DATABASE_URL"
echo "   - Paste the connection string above"
echo "   - Click 'Update secret'"
echo ""
echo "3. Verify the format:"
echo "   The connection string should start with: sqlserver://"
echo ""
if [[ ! "$DATABASE_URL" =~ ^sqlserver:// ]]; then
  echo "⚠️  WARNING: Current DATABASE_URL does NOT start with 'sqlserver://'"
  echo "   This will cause deployment failures!"
  echo ""
  echo "   Expected format:"
  echo "   sqlserver://orionweb-sqlserver.database.windows.net:1433;database=EMCWorkspaceDB;user=USERNAME;password=PASSWORD;encrypt=true"
  echo ""
fi
echo "=========================================="
