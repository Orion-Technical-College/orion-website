# Azure App Service Authentication Configuration Guide

## Overview

This guide provides step-by-step instructions for configuring NextAuth.js environment variables in Azure App Service for the EMC Workspace application.

## Prerequisites

- Access to Azure Portal
- App Service `emc-workspace` created and running
- Azure SQL Database configured with `DATABASE_URL` already set

## Step-by-Step Configuration

### Step 1: Navigate to Environment Variables

1. Open [Azure Portal](https://portal.azure.com)
2. Navigate to **App Services** → `emc-workspace`
3. In the left sidebar, go to **Settings** → **Environment variables**

### Step 2: Add NEXTAUTH_URL

1. Click **+ Add** button
2. Enter the following:
   - **Name**: `NEXTAUTH_URL`
   - **Value**: `https://emc-workspace.azurewebsites.net`
3. Click **OK**

### Step 3: Generate and Add NEXTAUTH_SECRET

1. Generate a secure secret locally:
   ```bash
   openssl rand -base64 32
   ```
2. Copy the output (e.g., `ePQ+JD5BG+Hs5UUvpOh9emVOfDulqFMMqN7LGZW/GXI=`)

3. In Azure Portal, click **+ Add** again
4. Enter:
   - **Name**: `NEXTAUTH_SECRET`
   - **Value**: (paste the generated secret)
5. Click **OK**

### Step 4: Verify Existing Variables

Ensure these are set:
- **DATABASE_URL**: Should already be configured
- **NODE_ENV**: Should be `production` (if not, add it)

### Step 5: Apply Changes

1. Click **Apply** at the top of the Environment variables page
2. Wait for the save to complete
3. The App Service will automatically restart

Alternatively, you can manually restart:
1. Go to **Overview** in the App Service
2. Click **Restart** button

## Verification

### Test 1: Login Page

1. Navigate to `https://emc-workspace.azurewebsites.net/login`
2. You should see the login form
3. Try logging in with Platform Admin credentials:
   - Email: `rjames@orion.edu` (or your configured email via `PLATFORM_ADMIN_EMAIL`)
   - Password: `ChangeMe123!` (or your configured password via `PLATFORM_ADMIN_PASSWORD`)

### Test 2: Session Endpoint

1. After logging in, open a new tab
2. Navigate to `https://emc-workspace.azurewebsites.net/api/auth/session`
3. You should see JSON response like:
   ```json
   {
     "user": {
       "id": "...",
       "email": "rjames@orion.edu",
       "name": "Rodney James",
       "role": "PLATFORM_ADMIN",
       "clientId": null,
       "isInternal": true
     },
     "expires": "..."
   }
   ```
4. If you see `{"user": null}`, the session is not being set correctly

### Test 3: Middleware Protection

1. Open an **incognito/private window**
2. Navigate to `https://emc-workspace.azurewebsites.net/admin`
3. You should be redirected to `/login`
4. This confirms middleware is protecting routes

## Troubleshooting

### Issue: 500 Errors on `/api/auth/*`

**Possible Causes:**
- `NEXTAUTH_SECRET` is missing or invalid
- `NEXTAUTH_URL` is incorrect
- Database connection issues

**Solution:**
1. Check App Service **Log stream** for error messages
2. Verify both `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are set
3. Ensure `NEXTAUTH_URL` matches your actual App Service URL exactly

### Issue: Login Loops

**Possible Causes:**
- `NEXTAUTH_URL` doesn't match the actual URL
- Cookie settings are incorrect
- Session callback errors

**Solution:**
1. Verify `NEXTAUTH_URL` is exactly `https://emc-workspace.azurewebsites.net`
2. Check browser console for errors
3. Clear browser cookies and try again
4. Check App Service logs for callback errors

### Issue: `/api/auth/session` Always Returns `null`

**Possible Causes:**
- Cookies not being set (check browser DevTools → Application → Cookies)
- `NEXTAUTH_SECRET` mismatch
- Cookie domain/path issues

**Solution:**
1. Check browser cookies - look for `next-auth.session-token` or `__Secure-next-auth.session-token`
2. Verify `NEXTAUTH_SECRET` is set and not empty
3. Ensure cookies are being sent (check Network tab → Request Headers)
4. Try in a different browser or incognito mode

### Issue: Configuration Validation Errors

**Solution:**
1. Run validation script locally: `npm run validate:config`
2. Check that all required variables are set
3. Verify `NEXTAUTH_SECRET` is at least 32 characters

## Visual Flow

```
┌─────────────────────────────────────┐
│ Azure Portal                        │
│ App Service → Settings              │
│ → Environment variables            │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Add NEXTAUTH_URL                    │
│ Value: https://emc-workspace...     │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Generate NEXTAUTH_SECRET            │
│ openssl rand -base64 32             │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Add NEXTAUTH_SECRET                │
│ Value: [generated secret]          │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Click Apply → App Restarts          │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Test: /login → /api/auth/session   │
│ Verify session works                │
└─────────────────────────────────────┘
```

## Security Best Practices

1. **Never commit secrets to git** - `NEXTAUTH_SECRET` should only exist in Azure App Service configuration
2. **Use different secrets per environment** - Dev, staging, and production should have unique secrets
3. **Rotate secrets periodically** - Change `NEXTAUTH_SECRET` every 90 days or after security incidents
4. **Monitor audit logs** - Check `AuditLog` table for suspicious authentication attempts
5. **Use HTTPS only** - Ensure `NEXTAUTH_URL` uses `https://` in production

## Next Steps

After successful configuration:

1. Change the default Platform Admin password
2. Create additional user accounts as needed
3. Configure client organizations
4. Monitor authentication metrics
5. Review audit logs regularly

## Support

For additional help:
- Check App Service **Log stream** for real-time errors
- Review **Application Insights** for detailed metrics
- Consult the main [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) for comprehensive deployment guide

