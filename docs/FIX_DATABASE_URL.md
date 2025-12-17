# Fix DATABASE_URL GitHub Secret

## Quick Fix Steps

### Step 1: Get Connection String from Azure Portal

1. **Go to App Service:**
   - Click on `emc-workspace` in Azure Portal
   - Navigate to **Configuration** → **Application settings**
   - Find `DATABASE_URL` and copy its value

2. **OR Get SQL Server Details:**
   - Click on `orionweb-sqlserver` (SQL server)
   - Note the server name: `orionweb-sqlserver.database.windows.net`
   - Check admin username (likely: `orionweb-sqlserver-heru`)
   - If you need to reset password:
     - Go to **Settings** → **Security** → **SQL authentication**
     - Click **Reset password**

### Step 2: Construct Connection String (if needed)

Format:
```
sqlserver://orionweb-sqlserver.database.windows.net:1433;database=EMCWorkspaceDB;user=orionweb-sqlserver-heru;password=YOUR_PASSWORD;encrypt=true
```

Replace `YOUR_PASSWORD` with the actual SQL Server admin password.

### Step 3: Update GitHub Secret

1. Go to: https://github.com/Orion-Technical-College/orion-website/settings/secrets/actions
2. Find or create: `DATABASE_URL`
3. Paste the full connection string (must start with `sqlserver://`)
4. Click **Update secret**

### Step 4: Verify

The connection string must:
- ✅ Start with `sqlserver://`
- ✅ Include server: `orionweb-sqlserver.database.windows.net:1433`
- ✅ Include database: `database=EMCWorkspaceDB`
- ✅ Include user: `user=orionweb-sqlserver-heru`
- ✅ Include password: `password=ACTUAL_PASSWORD`
- ✅ Include encryption: `encrypt=true`

## Alternative: Use Scripts

### Get from App Service:
```bash
./scripts/get-database-url.sh
```

### Reset Password and Get New Connection String:
```bash
./scripts/update-database-url.sh
```

This will:
1. Reset SQL Server password
2. Update App Service
3. Display connection string to copy to GitHub

## After Updating

Once the GitHub secret is updated:
- The next deployment will pass validation
- Migrations will run automatically
- Database connection will work
