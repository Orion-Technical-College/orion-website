#!/bin/bash

# Script to update DATABASE_URL in Azure App Service
# This will reset the SQL server password and update the connection string

set -e

echo "=========================================="
echo "Update DATABASE_URL Configuration"
echo "=========================================="

# Configuration
RESOURCE_GROUP="orion-website-rg"
SQL_SERVER="orionweb-sqlserver"
SQL_USERNAME="orionweb-sqlserver-heru"
DATABASE_NAME="EMCWorkspaceDB"
APP_SERVICE_NAME="emc-workspace"

# Generate a secure password
# Password requirements: 8+ chars, uppercase, lowercase, numbers, special chars
NEW_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-24)
# Ensure it has required complexity
NEW_PASSWORD="${NEW_PASSWORD}A1!"

echo ""
echo "Step 1: Resetting SQL Server password..."
echo "Server: $SQL_SERVER"
echo "Username: $SQL_USERNAME"
echo "New password will be generated securely"
echo ""

# Reset SQL server password
az sql server update \
  --name "$SQL_SERVER" \
  --resource-group "$RESOURCE_GROUP" \
  --admin-password "$NEW_PASSWORD" \
  --output none

echo "✓ SQL server password reset successfully"
echo ""

# Construct connection string
CONNECTION_STRING="sqlserver://${SQL_SERVER}.database.windows.net:1433;database=${DATABASE_NAME};user=${SQL_USERNAME};password=${NEW_PASSWORD};encrypt=true"

echo "Step 2: Updating App Service DATABASE_URL..."
az webapp config appsettings set \
  --name "$APP_SERVICE_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings "DATABASE_URL=$CONNECTION_STRING" \
  --output none

echo "✓ App Service DATABASE_URL updated"
echo ""

echo "Step 3: Restarting App Service..."
az webapp restart \
  --name "$APP_SERVICE_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --output none

echo "✓ App Service restarted"
echo ""

echo "=========================================="
echo "✅ Configuration Complete!"
echo "=========================================="
echo ""
echo "📋 IMPORTANT: Save this information securely"
echo ""
echo "SQL Server: $SQL_SERVER"
echo "Username: $SQL_USERNAME"
echo "Password: $NEW_PASSWORD"
echo ""
echo "Connection String:"
echo "$CONNECTION_STRING"
echo ""
echo "=========================================="
echo "🔐 Next Steps:"
echo "=========================================="
echo ""
echo "1. Update GitHub Secret DATABASE_URL:"
echo "   - Go to: GitHub Repo → Settings → Secrets → Actions"
echo "   - Update DATABASE_URL secret with the connection string above"
echo ""
echo "2. Verify connection:"
echo "   az webapp config appsettings list \\"
echo "     --name $APP_SERVICE_NAME \\"
echo "     --resource-group $RESOURCE_GROUP \\"
echo "     --query \"[?name=='DATABASE_URL'].value\""
echo ""
echo "3. Check application logs:"
echo "   az webapp log tail \\"
echo "     --name $APP_SERVICE_NAME \\"
echo "     --resource-group $RESOURCE_GROUP"
echo ""

