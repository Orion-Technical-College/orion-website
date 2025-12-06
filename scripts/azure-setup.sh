#!/bin/bash
# EMC Workspace - Azure Infrastructure Setup Script
# This script reconfigures the existing Orion infrastructure for EMC Workspace
#
# Prerequisites:
# 1. Azure CLI installed: brew install azure-cli
# 2. Logged in: az login
# 3. Correct subscription selected: az account set --subscription "your-subscription"
#
# Usage: ./scripts/azure-setup.sh

set -e

# Configuration
RESOURCE_GROUP="orion-website-rg"
LOCATION="centralus"  # Matches existing resource group location
APP_SERVICE_PLAN="emc-workspace-plan"
APP_NAME="emc-workspace"
SQL_SERVER="orionweb-sqlserver"
SQL_DATABASE="EMCWorkspaceDB"

echo "=========================================="
echo "EMC Workspace - Azure Infrastructure Setup"
echo "=========================================="
echo ""
echo "Resource Group: $RESOURCE_GROUP"
echo "App Service: $APP_NAME"
echo "SQL Server: $SQL_SERVER"
echo "Database: $SQL_DATABASE"
echo ""

# Check if logged in
echo "Checking Azure CLI login status..."
az account show > /dev/null 2>&1 || { echo "Please run 'az login' first"; exit 1; }
echo "✓ Logged in to Azure"
echo ""

# Step 1: Delete old App Service (if exists)
echo "Step 1: Cleaning up old resources..."
echo "---------------------------------------"

if az webapp show --name orion-website --resource-group $RESOURCE_GROUP > /dev/null 2>&1; then
    echo "Deleting old orion-website App Service..."
    az webapp delete --name orion-website --resource-group $RESOURCE_GROUP
    echo "✓ Old App Service deleted"
else
    echo "✓ Old App Service already removed or doesn't exist"
fi

# Check for old App Service Plan
OLD_PLAN=$(az appservice plan list --resource-group $RESOURCE_GROUP --query "[?name!='$APP_SERVICE_PLAN'].name" -o tsv 2>/dev/null || true)
if [ -n "$OLD_PLAN" ]; then
    echo "Found old App Service Plan(s): $OLD_PLAN"
    echo "You may want to delete these manually if not needed:"
    echo "  az appservice plan delete --name <plan-name> --resource-group $RESOURCE_GROUP"
fi
echo ""

# Step 2: Create Linux App Service Plan
echo "Step 2: Creating App Service Plan..."
echo "---------------------------------------"

if az appservice plan show --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP > /dev/null 2>&1; then
    echo "✓ App Service Plan '$APP_SERVICE_PLAN' already exists"
else
    echo "Creating Linux App Service Plan..."
    az appservice plan create \
        --name $APP_SERVICE_PLAN \
        --resource-group $RESOURCE_GROUP \
        --sku B1 \
        --is-linux \
        --location $LOCATION
    echo "✓ App Service Plan created"
fi
echo ""

# Step 3: Create Web App
echo "Step 3: Creating Web App..."
echo "---------------------------------------"

if az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP > /dev/null 2>&1; then
    echo "✓ Web App '$APP_NAME' already exists"
else
    echo "Creating Node.js 20 Web App..."
    az webapp create \
        --name $APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --plan $APP_SERVICE_PLAN \
        --runtime "NODE:20-lts"
    echo "✓ Web App created"
fi
echo ""

# Step 4: Create Staging Slot
echo "Step 4: Creating Staging Slot..."
echo "---------------------------------------"

if az webapp deployment slot show --name $APP_NAME --slot staging --resource-group $RESOURCE_GROUP > /dev/null 2>&1; then
    echo "✓ Staging slot already exists"
else
    echo "Creating staging deployment slot..."
    az webapp deployment slot create \
        --name $APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --slot staging
    echo "✓ Staging slot created"
fi
echo ""

# Step 5: Create New Database
echo "Step 5: Creating Database..."
echo "---------------------------------------"

if az sql db show --name $SQL_DATABASE --server $SQL_SERVER --resource-group $RESOURCE_GROUP > /dev/null 2>&1; then
    echo "✓ Database '$SQL_DATABASE' already exists"
else
    echo "Creating new database on existing SQL server..."
    az sql db create \
        --name $SQL_DATABASE \
        --resource-group $RESOURCE_GROUP \
        --server $SQL_SERVER \
        --service-objective S0
    echo "✓ Database created"
fi
echo ""

# Step 6: Configure App Settings
echo "Step 6: Configuring App Settings..."
echo "---------------------------------------"
echo "Setting Node.js configuration..."

az webapp config set \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --startup-file "node_modules/.bin/next start"

az webapp config appsettings set \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --settings \
        WEBSITE_NODE_DEFAULT_VERSION="~20" \
        NODE_ENV="production"

echo "✓ App settings configured"
echo ""

# Summary
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "URLs:"
echo "  Production: https://$APP_NAME.azurewebsites.net"
echo "  Staging:    https://$APP_NAME-staging.azurewebsites.net"
echo ""
echo "Next Steps:"
echo "1. Get the staging publish profile from Azure Portal:"
echo "   Azure Portal > App Services > $APP_NAME > Deployment slots > staging"
echo "   > Get publish profile"
echo ""
echo "2. Add GitHub Secrets:"
echo "   - AZURE_WEBAPP_PUBLISH_PROFILE_STAGING: (paste publish profile XML)"
echo "   - AZURE_CREDENTIALS: (service principal JSON)"
echo "   - DATABASE_URL: sqlserver://$SQL_SERVER.database.windows.net:1433;database=$SQL_DATABASE;user=<username>;password=<password>;encrypt=true"
echo ""
echo "3. Set database connection in App Service:"
echo "   az webapp config appsettings set --name $APP_NAME --resource-group $RESOURCE_GROUP --settings DATABASE_URL=\"<your-connection-string>\""
echo ""
echo "4. Run Prisma migrations:"
echo "   DATABASE_URL=\"<your-connection-string>\" npx prisma migrate deploy"
echo ""

