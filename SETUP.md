# Authentication Setup Guide

This guide will help you set up the authentication system for EMC Workspace.

## Prerequisites

- Database connection string (Azure SQL)
- Node.js and npm installed

## Step 1: Environment Variables

### Option A: Automated Setup (Recommended)

Run the setup script to generate NEXTAUTH_SECRET and create .env.local:

```bash
./scripts/setup-env.sh
```

Then edit `.env.local` and add your `DATABASE_URL`.

### Option B: Manual Setup

1. Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```

2. Generate NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```

3. Edit `.env.local` and set:
   - `DATABASE_URL` - Your Azure SQL connection string
   - `NEXTAUTH_SECRET` - The generated secret from step 2
   - `NEXTAUTH_URL` - Your application URL (default: http://localhost:3000)

## Step 2: Database Migration

Push the schema to your database:

```bash
npm run db:push
```

This will create all the necessary tables:
- User (with auth fields)
- Client
- Candidate (updated with clientId)
- Campaign
- CampaignRecipient
- AuditLog

## Step 3: Seed Initial Data

Create the initial Platform Admin user:

```bash
npm run db:seed
```

This creates:
- A default client (if needed)
- Platform Admin user with credentials:
  - Name: `Rodney James` (or set `PLATFORM_ADMIN_NAME`)
  - Email: `rjames@orion.edu` (or set `PLATFORM_ADMIN_EMAIL`)
  - Password: `ChangeMe123!` (or set `PLATFORM_ADMIN_PASSWORD`)

**⚠️ Important:** Change the default password after first login!

## Step 4: Verify Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000/login

3. Login with the Platform Admin credentials

4. Access the admin dashboard at http://localhost:3000/admin

## Troubleshooting

### Database Connection Issues

- Verify your `DATABASE_URL` is correct
- Check Azure SQL firewall rules allow your IP
- Ensure the database exists

### Authentication Errors

- Verify `NEXTAUTH_SECRET` is set and not empty
- Check `NEXTAUTH_URL` matches your application URL
- Clear browser cookies and try again

### Schema Migration Issues

If you encounter errors during `db:push`:

1. Check for existing data conflicts
2. Review the error messages
3. You may need to manually migrate existing data

## Next Steps

After setup is complete:

1. **Change Default Password**: Login and update the Platform Admin password
2. **Create Additional Users**: Use the admin dashboard to create Recruiters
3. **Configure Clients**: Add client organizations as needed
4. **Test Permissions**: Verify role-based access control works correctly

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Azure SQL connection string | Yes |
| `NEXTAUTH_SECRET` | Secret for session encryption | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `PLATFORM_ADMIN_NAME` | Initial admin name (optional, default: "Rodney James") | No |
| `PLATFORM_ADMIN_EMAIL` | Initial admin email (optional, default: "rjames@orion.edu") | No |
| `PLATFORM_ADMIN_PASSWORD` | Initial admin password (optional, default: "ChangeMe123!") | No |

## Support

For issues or questions, refer to the authentication plan document or contact the development team.

