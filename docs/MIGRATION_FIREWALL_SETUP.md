# Running Database Migrations - Firewall Setup

## Issue

When running migrations, you may encounter this error:

```
Cannot open server 'orionweb-sqlserver' requested by the login. 
Client with IP address '70.163.214.70' is not allowed to access the server.
```

This means your IP address is not whitelisted in the Azure SQL Server firewall rules.

## Solution: Add Your IP to Azure SQL Firewall

### Option 1: Azure Portal (Recommended)

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your SQL Server resource (`orionweb-sqlserver`)
3. Go to **Security** → **Networking** (or **Firewalls and virtual networks**)
4. Click **Add client IP** or manually add your IP address
5. Click **Save**
6. Wait 1-5 minutes for the change to take effect

### Option 2: Azure CLI

```bash
az sql server firewall-rule create \
  --resource-group <your-resource-group> \
  --server orionweb-sqlserver \
  --name "AllowMyIP" \
  --start-ip-address 70.163.214.70 \
  --end-ip-address 70.163.214.70
```

### Option 3: SQL Command (if you have access via another method)

```sql
EXEC sp_set_firewall_rule 
  @name = N'AllowMyIP',
  @start_ip_address = '70.163.214.70',
  @end_ip_address = '70.163.214.70'
```

## Finding Your IP Address

Your current IP address is shown in the error message. You can also check it with:

```bash
curl ifconfig.me
```

## Running the Migration

Once your IP is whitelisted, you can run the migration using one of these methods:

### Method 1: Using the helper script

```bash
./scripts/run-migration-with-env.sh
```

### Method 2: Using Node.js with dotenv

```bash
node -e "require('dotenv').config({path: '.env.local'}); require('child_process').execSync('npx prisma migrate deploy', {stdio: 'inherit'})"
```

### Method 3: Manual (if you have DATABASE_URL in your environment)

```bash
npx prisma migrate deploy
```

## Migration File

The migration file is located at:
```
prisma/migrations/20260109160000_add_rate_limit_table/migration.sql
```

This migration creates the `RateLimit` table needed for persistent rate limiting in the authentication system.

## Verification

After running the migration, verify the table was created:

```bash
npx prisma studio
```

Or check via SQL:

```sql
SELECT * FROM RateLimit;
```

## Troubleshooting

### Still getting firewall errors?

1. Wait 5 minutes after adding the firewall rule
2. Verify your IP address hasn't changed (if using dynamic IP)
3. Check if you're behind a VPN or proxy (you may need to whitelist that IP instead)
4. Verify the firewall rule was saved correctly in Azure Portal

### Connection timeout?

- Check your network connection
- Verify the DATABASE_URL is correct
- Ensure the SQL Server is running and accessible
