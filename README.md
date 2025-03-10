# Orion Technical College Website

## Overview

This repository contains the source code and deployment configurations for the Orion Technical College Website. The website is built using ASP.NET Framework 4.8 and is deployed to Azure cloud infrastructure using GitHub Actions for CI/CD.

## Architecture

The system uses a modern cloud architecture with the following components:

- **Web Application**: ASP.NET Framework 4.8 hosted on Azure App Service
- **Database**: Azure SQL Database
- **Security**: Azure Key Vault for secrets management
- **Monitoring**: Azure Application Insights
- **CI/CD**: GitHub Actions for automated deployment

### Infrastructure Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Azure Cloud Infrastructure                    │
│                                                                  │
│   ┌─────────────────┐         ┌──────────────────────────┐      │
│   │                 │         │                          │      │
│   │  Azure App      │         │  Azure SQL Database      │      │
│   │  Service        │◄────────►  (OrionWebDB)            │      │
│   │  (Windows)      │         │                          │      │
│   │                 │         │                          │      │
│   └────────┬────────┘         └──────────────────────────┘      │
│            │                                                     │
│            │                                                     │
│            │                                                     │
│   ┌────────▼────────┐         ┌──────────────────────────┐      │
│   │                 │         │                          │      │
│   │  Application    │         │  Azure Key Vault         │      │
│   │  Insights       │         │  (Secrets Management)    │      │
│   │                 │         │                          │      │
│   └─────────────────┘         └──────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
          ▲
          │
          │
          │
┌─────────┴────────────┐
│                      │
│  GitHub              │
│  Repository &        │
│  GitHub Actions      │
│  CI/CD Pipeline      │
│                      │
└──────────────────────┘
```

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: ASP.NET Framework 4.8
- **Database**: Azure SQL Database (SQL Server 2019)
- **Authentication**: Forms Authentication & Azure AD (for admin portal)
- **Cloud Provider**: Microsoft Azure
- **DevOps**: GitHub Actions

## Development Setup

### Prerequisites

- Visual Studio 2019 or newer
- .NET Framework 4.8 SDK
- SQL Server Management Studio (SSMS)
- Azure CLI (for Azure resource management)
- Git

### Clone the Repository

```bash
git clone https://github.com/Orion-Technical-College/orion-website.git
cd orion-website
```

### Local Development Configuration

1. Open the solution file (`*.sln`) in Visual Studio
2. Restore NuGet packages
3. Configure local connection strings in `web.config`
4. Run the application locally using IIS Express

### Local Database Setup

1. Connect to your local SQL Server instance
2. Run the SQL scripts from the `Database-Script` folder in order
3. Verify the database tables have been created correctly

## Project Structure

```
orion-website/
├── App_Data/                 # Application data files
├── Content/                  # CSS and static content
├── Controllers/              # MVC Controllers
├── Models/                   # MVC Models
├── Views/                    # MVC Views
├── Scripts/                  # JavaScript files
├── images/                   # Image assets
├── bin/                      # Required DLLs for ASP.NET MVC
├── Database-Script/          # SQL database scripts
├── .github/workflows/        # GitHub Actions workflow definitions
│   └── main_orion_website(staging).yml      # Deployment workflow
├── web.config                # Application configuration
└── Global.asax               # Application entry point
```

## Deployment Process

The website uses a blue-green deployment strategy with Azure App Service deployment slots to ensure zero-downtime updates.

### Deployment Workflow

1. **Code Push**: Push changes to the main branch
2. **Build**: GitHub Actions automatically builds the application
3. **Database Update**: Executes any new SQL scripts against the database
4. **Deploy to Staging**: Deploys the new build to the staging slot
5. **Validate Staging**: Verifies the staging deployment is successful
6. **Swap Slots**: Swaps staging slot with production
7. **Validate Production**: Verifies the production environment is working properly

### GitHub Actions Configuration

The deployment is managed through the GitHub Actions workflow defined in `.github/workflows/main_orion_website(staging).yml`. This workflow:

- Builds the website
- Packages it for deployment
- Deploys database changes
- Deploys to Azure using a blue-green deployment strategy

### Required Secrets

The following secrets need to be configured in GitHub:

| Secret Name | Description |
|-------------|-------------|
| AZURE_CREDENTIALS | JSON credential for Azure authentication |
| AZURE_SQL_USERNAME | Username for Azure SQL Database |
| AZURE_SQL_PASSWORD | Password for Azure SQL Database |

## Database Management

### Schema Updates

1. Create a new SQL script in the `Database-Script` folder
2. Name it with a sequential prefix for proper ordering (e.g., `01_CreateUsers.sql`, `02_AddColumns.sql`)
3. Write idempotent scripts (scripts that can run multiple times without errors)
4. The CI/CD pipeline will automatically execute new scripts during deployment

### Accessing Database

- **Development**: Connect using SSMS with your local credentials
- **Production**: Access requires Azure credentials and is restricted to IT team members

## Azure Resources

| Resource | Name | Purpose |
|----------|------|---------|
| Resource Group | orion-website-rg | Container for all project resources |
| App Service | orion-website | Hosting the ASP.NET Framework 4.8 website |
| App Service Plan | ASP-orionwebsiterg-xxxx | Underlying server farm for the App Service |
| Key Vault | orion-website-kv | Secure storage for connection strings and secrets |
| SQL Database | OrionWebDB | Database for the application |
| SQL Server | orionweb-sqlserver | Hosts the SQL Database |
| Application Insights | orion-website | Monitoring and performance analytics |

## Environment Variables and Configuration

### App Service Configuration

- **Runtime Stack**: ASP.NET V4.8
- **Operating System**: Windows
- **Always On**: Enabled
- **HTTP Version**: 1.1
- **HTTPS Only**: Enabled to enforce HTTPS for all connections
- **ARR Affinity**: Disabled for improved performance

### Connection Strings

Connection strings are stored in Azure Key Vault and referenced in the App Service configuration:

```
ConnectionStrings__DefaultConnection: @Microsoft.KeyVault(SecretUri=https://orion-website-kv.vault.azure.net/secrets/SqlConnectionString/)
```

## Access Management

### Contractor Access

Contractors are granted  access to all website resources:

1. Contractors are added to the `orion-website-rg` resource group in Azure
2. They are assigned the "Custom Contributor" role

## Troubleshooting

### Common Issues

#### Missing Assembly Errors

If you encounter errors about missing assemblies:
1. Ensure all required DLLs are in the bin directory
2. Verify DLL versions match what's specified in web.config
3. Check Azure App Service logs for specific error details

#### Configuration Errors

If you see "Server Error in '/' Application. Configuration Error":
1. Verify web.config syntax is correct
2. Check for missing sections or incorrectly formatted XML
3. Ensure connection strings and app settings are properly configured

#### Deployment Failures

If GitHub Actions deployment fails:
1. Check GitHub Actions logs for specific error messages
2. Verify the AZURE_CREDENTIALS secret is correctly configured
3. Ensure the Azure App Service name matches in the workflow file

### Accessing Logs

- **App Service Logs**: Go to Azure Portal > App Service > orion-website > Log stream
- **Detailed Logs**: Go to Kudu site (Advanced Tools) > Debug console > Log files
- **Application Insights**: For application performance monitoring and errors

## Support & Contact

- **IT Department**: it@orion.edu


## Contributing

1. Create a feature branch from dev
2. Make your changes
3. Submit a pull request for review
4. PRs will automatically deploy to the staging environment for testing

## License

Copyright © 2025 Orion Technical College. All rights reserved.